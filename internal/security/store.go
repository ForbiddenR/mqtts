package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"
	"runtime"

	"github.com/zalando/go-keyring"
)

const servicePrefix = "mqtts"

// CredentialStore provides secure storage for sensitive values like passwords.
type CredentialStore interface {
	// Store saves a credential keyed by connection ID and field name.
	Store(connID, field, value string) error
	// Retrieve gets a credential keyed by connection ID and field name.
	Retrieve(connID, field string) (string, error)
	// Delete removes a credential keyed by connection ID and field name.
	Delete(connID, field string) error
	// DeleteAll removes all credentials for a connection.
	DeleteAll(connID string) error
}

// KeychainStore stores credentials in the OS keychain.
type KeychainStore struct{}

// NewKeychainStore creates a new KeychainStore.
func NewKeychainStore() *KeychainStore {
	return &KeychainStore{}
}

func (k *KeychainStore) key(connID, field string) string {
	return fmt.Sprintf("%s/%s/%s", servicePrefix, connID, field)
}

func (k *KeychainStore) Store(connID, field, value string) error {
	return keyring.Set(k.key(connID, field), servicePrefix, value)
}

func (k *KeychainStore) Retrieve(connID, field string) (string, error) {
	val, err := keyring.Get(k.key(connID, field), servicePrefix)
	if err == keyring.ErrNotFound {
		return "", nil
	}
	return val, err
}

func (k *KeychainStore) Delete(connID, field string) error {
	err := keyring.Delete(k.key(connID, field), servicePrefix)
	if err == keyring.ErrNotFound {
		return nil
	}
	return err
}

func (k *KeychainStore) DeleteAll(connID string) error {
	// Delete known fields
	for _, field := range []string{"password", "key"} {
		_ = k.Delete(connID, field)
	}
	return nil
}

// EncryptedStore is a fallback that encrypts credentials with a machine-derived key
// and stores them as base64 in memory. Use only when keychain is unavailable.
type EncryptedStore struct {
	secrets map[string]string // key -> base64-encoded encrypted value
	key     []byte
}

// NewEncryptedStore creates a new EncryptedStore with a machine-derived key.
func NewEncryptedStore() (*EncryptedStore, error) {
	machineKey, err := deriveMachineKey()
	if err != nil {
		return nil, fmt.Errorf("derive machine key: %w", err)
	}
	return &EncryptedStore{
		secrets: make(map[string]string),
		key:     machineKey,
	}, nil
}

func (e *EncryptedStore) keyID(connID, field string) string {
	return connID + "/" + field
}

func (e *EncryptedStore) Store(connID, field, value string) error {
	encrypted, err := encryptAES(e.key, []byte(value))
	if err != nil {
		return fmt.Errorf("encrypt: %w", err)
	}
	e.secrets[e.keyID(connID, field)] = base64.StdEncoding.EncodeToString(encrypted)
	return nil
}

func (e *EncryptedStore) Retrieve(connID, field string) (string, error) {
	enc, ok := e.secrets[e.keyID(connID, field)]
	if !ok {
		return "", nil
	}
	data, err := base64.StdEncoding.DecodeString(enc)
	if err != nil {
		return "", fmt.Errorf("decode: %w", err)
	}
	plaintext, err := decryptAES(e.key, data)
	if err != nil {
		return "", fmt.Errorf("decrypt: %w", err)
	}
	return string(plaintext), nil
}

func (e *EncryptedStore) Delete(connID, field string) error {
	delete(e.secrets, e.keyID(connID, field))
	return nil
}

func (e *EncryptedStore) DeleteAll(connID string) error {
	for _, field := range []string{"password", "key"} {
		delete(e.secrets, e.keyID(connID, field))
	}
	return nil
}

// NewCredentialStore creates the best available credential store for the current platform.
// Returns a KeychainStore if the OS keychain is available, otherwise falls back to EncryptedStore.
func NewCredentialStore() CredentialStore {
	// Test if keychain is available by storing and retrieving a test value
	testKey := "mqtts_test_probe"
	testVal := "test"
	if err := keyring.Set(testKey, servicePrefix, testVal); err == nil {
		if val, err := keyring.Get(testKey, servicePrefix); err == nil && val == testVal {
			_ = keyring.Delete(testKey, servicePrefix)
			return NewKeychainStore()
		}
		_ = keyring.Delete(testKey, servicePrefix)
	}

	// Fallback to encrypted store
	store, err := NewEncryptedStore()
	if err != nil {
		// Last resort: in-memory plaintext (should not happen)
		return &plainStore{secrets: make(map[string]string)}
	}
	return store
}

// plainStore is a last-resort in-memory store with no encryption.
type plainStore struct {
	secrets map[string]string
}

func (p *plainStore) Store(connID, field, value string) error {
	p.secrets[connID+"/"+field] = value
	return nil
}

func (p *plainStore) Retrieve(connID, field string) (string, error) {
	return p.secrets[connID+"/"+field], nil
}

func (p *plainStore) Delete(connID, field string) error {
	delete(p.secrets, connID+"/"+field)
	return nil
}

func (p *plainStore) DeleteAll(connID string) error {
	for _, field := range []string{"password", "key"} {
		delete(p.secrets, connID+"/"+field)
	}
	return nil
}

// deriveMachineKey derives a 32-byte AES key from machine-specific information.
func deriveMachineKey() ([]byte, error) {
	hostname, _ := os.Hostname()
	user := os.Getenv("USER")
	if user == "" {
		user = os.Getenv("USERNAME")
	}
	seed := fmt.Sprintf("%s:%s:%s:%s", hostname, user, runtime.GOOS, servicePrefix)
	hash := sha256.Sum256([]byte(seed))
	return hash[:], nil
}

// encryptAES encrypts plaintext using AES-GCM.
func encryptAES(key, plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

// decryptAES decrypts ciphertext using AES-GCM.
func decryptAES(key, ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}

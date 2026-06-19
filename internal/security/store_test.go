package security

import (
	"testing"
)

func TestEncryptedStore(t *testing.T) {
	store, err := NewEncryptedStore()
	if err != nil {
		t.Fatalf("new store: %v", err)
	}

	connID := "test-conn-1"

	// Store
	if err := store.Store(connID, "password", "secret123"); err != nil {
		t.Fatalf("store: %v", err)
	}

	// Retrieve
	val, err := store.Retrieve(connID, "password")
	if err != nil {
		t.Fatalf("retrieve: %v", err)
	}
	if val != "secret123" {
		t.Errorf("got %q, want %q", val, "secret123")
	}

	// Retrieve non-existent
	val, err = store.Retrieve(connID, "nonexistent")
	if err != nil {
		t.Fatalf("retrieve nonexistent: %v", err)
	}
	if val != "" {
		t.Errorf("got %q, want empty", val)
	}

	// Delete
	if err := store.Delete(connID, "password"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	val, _ = store.Retrieve(connID, "password")
	if val != "" {
		t.Errorf("after delete: got %q, want empty", val)
	}
}

func TestEncryptedStoreMultipleFields(t *testing.T) {
	store, err := NewEncryptedStore()
	if err != nil {
		t.Fatalf("new store: %v", err)
	}

	connID := "test-conn-2"

	store.Store(connID, "password", "pwd123")
	store.Store(connID, "key", "-----BEGIN PRIVATE KEY-----\nfake-key\n-----END PRIVATE KEY-----")

	// Both should be retrievable
	pwd, _ := store.Retrieve(connID, "password")
	if pwd != "pwd123" {
		t.Errorf("password = %q, want %q", pwd, "pwd123")
	}

	key, _ := store.Retrieve(connID, "key")
	if key != "-----BEGIN PRIVATE KEY-----\nfake-key\n-----END PRIVATE KEY-----" {
		t.Errorf("key mismatch")
	}

	// DeleteAll
	store.DeleteAll(connID)
	pwd, _ = store.Retrieve(connID, "password")
	key, _ = store.Retrieve(connID, "key")
	if pwd != "" || key != "" {
		t.Errorf("after deleteAll: password=%q, key=%q, want empty", pwd, key)
	}
}

func TestEncryptedStoreIsolation(t *testing.T) {
	store, err := NewEncryptedStore()
	if err != nil {
		t.Fatalf("new store: %v", err)
	}

	store.Store("conn-a", "password", "password-a")
	store.Store("conn-b", "password", "password-b")

	a, _ := store.Retrieve("conn-a", "password")
	b, _ := store.Retrieve("conn-b", "password")

	if a != "password-a" {
		t.Errorf("conn-a password = %q, want %q", a, "password-a")
	}
	if b != "password-b" {
		t.Errorf("conn-b password = %q, want %q", b, "password-b")
	}

	// Deleting conn-a should not affect conn-b
	store.Delete("conn-a", "password")
	b2, _ := store.Retrieve("conn-b", "password")
	if b2 != "password-b" {
		t.Errorf("conn-b password after conn-a delete = %q, want %q", b2, "password-b")
	}
}

func TestEncryptDecryptRoundtrip(t *testing.T) {
	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i)
	}

	plaintext := "hello, world! This is a test payload with special chars: !@#$%^&*()"

	encrypted, err := encryptAES(key, []byte(plaintext))
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}

	// Encrypted should be different from plaintext
	if string(encrypted) == plaintext {
		t.Error("encrypted == plaintext")
	}

	decrypted, err := decryptAES(key, encrypted)
	if err != nil {
		t.Fatalf("decrypt: %v", err)
	}

	if string(decrypted) != plaintext {
		t.Errorf("decrypted = %q, want %q", string(decrypted), plaintext)
	}
}

func TestEncryptDecryptWrongKey(t *testing.T) {
	key1 := make([]byte, 32)
	key2 := make([]byte, 32)
	for i := range key1 {
		key1[i] = byte(i)
		key2[i] = byte(i + 1)
	}

	encrypted, _ := encryptAES(key1, []byte("secret"))

	_, err := decryptAES(key2, encrypted)
	if err == nil {
		t.Error("expected error decrypting with wrong key")
	}
}

func TestPlainStore(t *testing.T) {
	store := &plainStore{secrets: make(map[string]string)}

	store.Store("c1", "password", "pwd")
	val, _ := store.Retrieve("c1", "password")
	if val != "pwd" {
		t.Errorf("got %q, want %q", val, "pwd")
	}

	store.Delete("c1", "password")
	val, _ = store.Retrieve("c1", "password")
	if val != "" {
		t.Errorf("after delete: got %q, want empty", val)
	}
}

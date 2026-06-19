# Security Model

## Credential Storage

mqtts stores MQTT broker passwords and TLS private keys using a tiered approach:

### 1. OS Keychain (preferred)

On supported platforms, credentials are stored in the OS keychain:

- **macOS**: Keychain Access
- **Windows**: Windows Credential Manager
- **Linux**: Secret Service (GNOME Keyring, KWallet)

The keychain is tested at startup with a probe. If the probe succeeds, all credentials go through the keychain.

### 2. AES-GCM Encrypted Fallback

If the OS keychain is unavailable (e.g., headless Linux, CI environments), credentials are encrypted with AES-256-GCM using a machine-derived key. The key is derived from:

- Hostname
- Username (`$USER` / `$USERNAME`)
- Operating system
- Application identifier

This is an in-memory store — encrypted credentials are lost when the app exits. This is intentional: the fallback exists to avoid plaintext in memory, not to persist across restarts without a keychain.

### 3. Plaintext Fallback (last resort)

If both keychain and AES derivation fail, an in-memory plaintext store is used. This should only occur in unusual environments.

## What Is Stored Where

| Field | SQLite | Keychain/Encrypted |
|-------|--------|--------------------|
| Connection config | ✅ | — |
| Password | ❌ (empty string) | ✅ |
| TLS private key | ❌ (empty string) | ✅ |
| TLS CA cert | ✅ | — |
| TLS client cert | ✅ | — |
| MQTT 5 properties | ✅ (JSON blob) | — |
| Subscriptions | ✅ | — |
| Messages | ✅ | — |
| Settings | ✅ | — |

## Logging

The application never logs:

- Passwords
- TLS private keys
- API keys (e.g., OpenAI API key in settings)
- Certificate content

Logged information includes:

- Connection status changes (connecting, connected, disconnected, error)
- Topic names and QoS levels
- Protocol-level error messages
- Subscription/unsubscription events

## Export

JSON exports include passwords and TLS keys in plaintext. The export dialog warns users to store the file securely.

## Future Improvements

- File-based encrypted store with user-provided passphrase
- Per-machine key derivation with hardware identifiers
- Secure memory zeroing after credential use
- Certificate chain validation logging

package mqtt

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
)

// PayloadFormat represents the encoding format for MQTT payloads.
type PayloadFormat string

const (
	FormatPlaintext PayloadFormat = "plaintext"
	FormatJSON      PayloadFormat = "json"
	FormatBase64    PayloadFormat = "base64"
	FormatHex       PayloadFormat = "hex"
)

// EncodePayload converts a string payload to bytes based on the specified format.
func EncodePayload(payload string, format PayloadFormat) ([]byte, error) {
	switch format {
	case FormatPlaintext, FormatJSON:
		return []byte(payload), nil
	case FormatBase64:
		return base64.StdEncoding.DecodeString(payload)
	case FormatHex:
		return hex.DecodeString(payload)
	default:
		return nil, fmt.Errorf("unsupported payload format: %s", format)
	}
}

// DecodePayload converts bytes to a string payload based on the specified format.
func DecodePayload(data []byte, format PayloadFormat) (string, error) {
	switch format {
	case FormatPlaintext:
		return string(data), nil
	case FormatJSON:
		// Pretty-print JSON for display
		var v interface{}
		if err := json.Unmarshal(data, &v); err != nil {
			return string(data), nil // Return raw if not valid JSON
		}
		pretty, err := json.MarshalIndent(v, "", "  ")
		if err != nil {
			return string(data), nil
		}
		return string(pretty), nil
	case FormatBase64:
		return base64.StdEncoding.EncodeToString(data), nil
	case FormatHex:
		return hex.EncodeToString(data), nil
	default:
		return string(data), nil
	}
}

// DetectFormat attempts to determine the payload format from the content.
func DetectFormat(data []byte) PayloadFormat {
	if len(data) == 0 {
		return FormatPlaintext
	}

	// Check if it's valid JSON
	var v interface{}
	if json.Unmarshal(data, &v) == nil {
		return FormatJSON
	}

	// Check if it's valid hex
	if _, err := hex.DecodeString(string(data)); err == nil && len(data)%2 == 0 {
		return FormatHex
	}

	// Check if it's valid base64
	if _, err := base64.StdEncoding.DecodeString(string(data)); err == nil {
		return FormatBase64
	}

	return FormatPlaintext
}

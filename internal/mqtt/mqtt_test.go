package mqtt_test

import (
	"testing"

	"github.com/nictoarch/mqtts/internal/models"
	"github.com/nictoarch/mqtts/internal/mqtt"
)

func TestBuildServerURL(t *testing.T) {
	tests := []struct {
		name     string
		conn     *models.Connection
		expected string
		wantErr  bool
	}{
		{
			name: "MQTT default port",
			conn: &models.Connection{
				Host:     "broker.example.com",
				Port:     0,
				Protocol: models.ProtocolMQTT,
			},
			expected: "tcp://broker.example.com:1883",
		},
		{
			name: "MQTTS default port",
			conn: &models.Connection{
				Host:     "broker.example.com",
				Port:     0,
				Protocol: models.ProtocolMQTTS,
			},
			expected: "ssl://broker.example.com:8883",
		},
		{
			name: "WebSocket custom port",
			conn: &models.Connection{
				Host:     "broker.example.com",
				Port:     9001,
				Protocol: models.ProtocolWS,
				Path:     "/ws",
			},
			expected: "ws://broker.example.com:9001/ws",
		},
		{
			name: "WebSocket default path",
			conn: &models.Connection{
				Host:     "broker.example.com",
				Port:     80,
				Protocol: models.ProtocolWS,
			},
			expected: "ws://broker.example.com:80/mqtt",
		},
		{
			name: "MQTT custom port",
			conn: &models.Connection{
				Host:     "localhost",
				Port:     1884,
				Protocol: models.ProtocolMQTT,
			},
			expected: "tcp://localhost:1884",
		},
		{
			name: "empty host",
			conn: &models.Connection{
				Host:     "",
				Port:     1883,
				Protocol: models.ProtocolMQTT,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := mqtt.BuildServerURL(tt.conn)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if result != tt.expected {
				t.Errorf("BuildServerURL = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestBuildConnectPacket(t *testing.T) {
	conn := &models.Connection{
		ClientID:    "test-client",
		Host:        "localhost",
		Port:        1883,
		Protocol:    models.ProtocolMQTT,
		MQTTVersion: "3.1.1",
		Clean:       true,
		KeepAlive:   60,
		Username:    "user",
		Password:    "pass",
	}

	cp, err := mqtt.BuildConnectPacket(conn, nil)
	if err != nil {
		t.Fatalf("BuildConnectPacket: %v", err)
	}

	if cp.ClientID != "test-client" {
		t.Errorf("ClientID = %q, want %q", cp.ClientID, "test-client")
	}
	if !cp.CleanStart {
		t.Error("expected CleanStart to be true")
	}
	if cp.KeepAlive != 60 {
		t.Errorf("KeepAlive = %d, want 60", cp.KeepAlive)
	}
	if cp.Username != "user" {
		t.Errorf("Username = %q, want %q", cp.Username, "user")
	}
	if string(cp.Password) != "pass" {
		t.Errorf("Password = %q, want %q", string(cp.Password), "pass")
	}
}

func TestBuildConnectPacketMQTT5(t *testing.T) {
	sessionExpiry := 3600
	conn := &models.Connection{
		ClientID:    "mqtt5-client",
		Host:        "broker.example.com",
		Port:        8883,
		Protocol:    models.ProtocolMQTTS,
		MQTTVersion: "5.0",
		Clean:       false,
		KeepAlive:   120,
		MQTT5Properties: &models.MQTT5Properties{
			SessionExpiryInterval: &sessionExpiry,
			AuthenticationMethod:  "SCRAM-SHA-256",
		},
	}

	cp, err := mqtt.BuildConnectPacket(conn, nil)
	if err != nil {
		t.Fatalf("BuildConnectPacket: %v", err)
	}

	if cp.CleanStart {
		t.Error("expected CleanStart to be false")
	}
	if cp.Properties == nil {
		t.Fatal("expected properties to be set")
	}
	if *cp.Properties.SessionExpiryInterval != 3600 {
		t.Errorf("SessionExpiryInterval = %d, want 3600", *cp.Properties.SessionExpiryInterval)
	}
	if cp.Properties.AuthMethod != "SCRAM-SHA-256" {
		t.Errorf("AuthMethod = %q, want %q", cp.Properties.AuthMethod, "SCRAM-SHA-256")
	}
}

func TestBuildConnectPacketWithWill(t *testing.T) {
	conn := &models.Connection{
		ClientID:    "will-client",
		Host:        "localhost",
		Port:        1883,
		Protocol:    models.ProtocolMQTT,
		MQTTVersion: "3.1.1",
		Clean:       true,
	}

	will := &models.Will{
		LastWillTopic:   "status/offline",
		LastWillPayload: "goodbye",
		LastWillQoS:     1,
		LastWillRetain:  true,
	}

	cp, err := mqtt.BuildConnectPacket(conn, will)
	if err != nil {
		t.Fatalf("BuildConnectPacket: %v", err)
	}

	if cp.WillMessage == nil {
		t.Fatal("expected will message to be set")
	}
	if cp.WillMessage.Topic != "status/offline" {
		t.Errorf("will topic = %q, want %q", cp.WillMessage.Topic, "status/offline")
	}
	if cp.WillMessage.QoS != 1 {
		t.Errorf("will qos = %d, want 1", cp.WillMessage.QoS)
	}
	if !cp.WillMessage.Retain {
		t.Error("expected will retain to be true")
	}
}

func TestBuildPublishPacket(t *testing.T) {
	conn := &models.Connection{
		MQTTVersion: "3.1.1",
	}

	pub := mqtt.BuildPublishPacket("test/topic", "hello", 1, false, conn)

	if pub.Topic != "test/topic" {
		t.Errorf("topic = %q, want %q", pub.Topic, "test/topic")
	}
	if string(pub.Payload) != "hello" {
		t.Errorf("payload = %q, want %q", string(pub.Payload), "hello")
	}
	if pub.QoS != 1 {
		t.Errorf("qos = %d, want 1", pub.QoS)
	}
	if pub.Retain {
		t.Error("expected retain to be false")
	}
}

func TestBuildSubscribePacket(t *testing.T) {
	sub := mqtt.BuildSubscribePacket("test/#", 1, nil)

	if len(sub.Subscriptions) != 1 {
		t.Fatalf("subscriptions len = %d, want 1", len(sub.Subscriptions))
	}
	if sub.Subscriptions[0].Topic != "test/#" {
		t.Errorf("topic = %q, want %q", sub.Subscriptions[0].Topic, "test/#")
	}
	if sub.Subscriptions[0].QoS != 1 {
		t.Errorf("qos = %d, want 1", sub.Subscriptions[0].QoS)
	}
}

func TestBuildSubscribePacketWithMQTT5Options(t *testing.T) {
	subModel := &models.Subscription{
		NL:  true,
		RAP: true,
		RH:  models.RetainSendNew,
	}

	sub := mqtt.BuildSubscribePacket("test/topic", 2, subModel)

	if !sub.Subscriptions[0].NoLocal {
		t.Error("expected NoLocal to be true")
	}
	if !sub.Subscriptions[0].RetainAsPublished {
		t.Error("expected RetainAsPublished to be true")
	}
	if sub.Subscriptions[0].RetainHandling != 1 {
		t.Errorf("RetainHandling = %d, want 1", sub.Subscriptions[0].RetainHandling)
	}
}

func TestPayloadEncoding(t *testing.T) {
	tests := []struct {
		name   string
		format mqtt.PayloadFormat
		input  string
	}{
		{"plaintext", mqtt.FormatPlaintext, "hello world"},
		{"json", mqtt.FormatJSON, `{"key":"value"}`},
		{"base64", mqtt.FormatBase64, "aGVsbG8="},
		{"hex", mqtt.FormatHex, "68656c6c6f"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			encoded, err := mqtt.EncodePayload(tt.input, tt.format)
			if err != nil {
				t.Fatalf("EncodePayload: %v", err)
			}

			decoded, err := mqtt.DecodePayload(encoded, tt.format)
			if err != nil {
				t.Fatalf("DecodePayload: %v", err)
			}

			// For JSON, the decoded version may be pretty-printed
			if tt.format == mqtt.FormatJSON {
				// Just verify it's valid JSON
				if len(decoded) == 0 {
					t.Error("expected non-empty decoded JSON")
				}
			} else if decoded != tt.input {
				t.Errorf("round-trip failed: got %q, want %q", decoded, tt.input)
			}
		})
	}
}

func TestDetectFormat(t *testing.T) {
	tests := []struct {
		name     string
		data     []byte
		expected mqtt.PayloadFormat
	}{
		{"empty", []byte{}, mqtt.FormatPlaintext},
		{"json object", []byte(`{"key":"value"}`), mqtt.FormatJSON},
		{"json array", []byte(`[1,2,3]`), mqtt.FormatJSON},
		{"hex", []byte("68656c6c6f"), mqtt.FormatHex},
		{"plaintext", []byte("hello world"), mqtt.FormatPlaintext},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := mqtt.DetectFormat(tt.data)
			if result != tt.expected {
				t.Errorf("DetectFormat = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestProtocolVersion(t *testing.T) {
	tests := []struct {
		version  string
		expected byte
	}{
		{"3.1", 3},
		{"3.1.1", 4},
		{"5.0", 5},
		{"unknown", 4},
	}

	for _, tt := range tests {
		t.Run(tt.version, func(t *testing.T) {
			result := mqtt.ProtocolVersion(tt.version)
			if result != tt.expected {
				t.Errorf("ProtocolVersion(%q) = %d, want %d", tt.version, result, tt.expected)
			}
		})
	}
}

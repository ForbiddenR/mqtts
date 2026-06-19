package models

// PublishHistoryHeader represents a cached publish topic/qos/retain combination.
type PublishHistoryHeader struct {
	Topic        string `json:"topic"`
	QoS          QoS    `json:"qos"`
	Retain       bool   `json:"retain"`
	ConnectionID string `json:"connection_id"`
}

// PublishHistoryPayload represents a cached publish payload.
type PublishHistoryPayload struct {
	Payload      string `json:"payload"`
	PayloadType  string `json:"payload_type"`
	ConnectionID string `json:"connection_id"`
}

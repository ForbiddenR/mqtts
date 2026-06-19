package models

import (
	"encoding/json"
	"time"
)

// QoS represents the MQTT Quality of Service level.
type QoS int

const (
	QoS0 QoS = 0
	QoS1 QoS = 1
	QoS2 QoS = 2
)

// Message represents a persisted MQTT message.
type Message struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	Out       bool      `json:"out"`
	Payload   string    `json:"payload"`
	QoS       QoS       `json:"qos"`
	Retain    bool      `json:"retain"`
	Topic     string    `json:"topic"`
	Meta      string    `json:"meta,omitempty"`

	// MQTT 5 publish properties
	PayloadFormatIndicator   *bool             `json:"payload_format_indicator,omitempty"`
	MessageExpiryInterval    *int              `json:"message_expiry_interval,omitempty"`
	TopicAlias               *int              `json:"topic_alias,omitempty"`
	ResponseTopic            string            `json:"response_topic,omitempty"`
	CorrelationData          string            `json:"correlation_data,omitempty"`
	UserProperties           map[string]string `json:"user_properties,omitempty"`
	SubscriptionIdentifier   *int              `json:"subscription_identifier,omitempty"`
	ContentType              string            `json:"content_type,omitempty"`

	ConnectionID string `json:"connection_id"`
}

// MessageFilter defines query filters for listing messages.
type MessageFilter struct {
	ConnectionID string
	Topic        string
	Out          *bool
	Limit        int
	Offset       int
}

// MarshalUserProperties marshals user properties to JSON.
func MarshalUserProperties(props map[string]string) json.RawMessage {
	if props == nil {
		return nil
	}
	return ToJSON(props)
}

// UnmarshalUserProperties unmarshals user properties from JSON.
func UnmarshalUserProperties(data json.RawMessage) map[string]string {
	if len(data) == 0 {
		return nil
	}
	var props map[string]string
	if err := json.Unmarshal(data, &props); err != nil {
		return nil
	}
	return props
}

package models

import "encoding/json"

// Will represents an MQTT Last Will and Testament configuration.
type Will struct {
	ID                 string `json:"id"`
	LastWillTopic      string `json:"last_will_topic"`
	LastWillPayload    string `json:"last_will_payload"`
	LastWillQoS        QoS    `json:"last_will_qos"`
	LastWillRetain     bool   `json:"last_will_retain"`

	// MQTT 5 will properties
	WillDelayInterval    *int              `json:"will_delay_interval,omitempty"`
	PayloadFormatIndicator *bool           `json:"payload_format_indicator,omitempty"`
	MessageExpiryInterval  *int            `json:"message_expiry_interval,omitempty"`
	ContentType          string            `json:"content_type,omitempty"`
	ResponseTopic        string            `json:"response_topic,omitempty"`
	CorrelationData      string            `json:"correlation_data,omitempty"`
	UserProperties       map[string]string `json:"user_properties,omitempty"`

	ConnectionID string `json:"connection_id"`
}

// MarshalUserPropertiesJSON marshals will user properties to JSON bytes.
func (w *Will) MarshalUserPropertiesJSON() json.RawMessage {
	return MarshalUserProperties(w.UserProperties)
}

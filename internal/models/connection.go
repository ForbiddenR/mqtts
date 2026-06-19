package models

import (
	"encoding/json"
	"time"
)

// Connection represents an MQTT broker connection configuration.
type Connection struct {
	ID                string          `json:"id"`
	ClientID          string          `json:"client_id"`
	Name              string          `json:"name"`
	Clean             bool            `json:"clean"`
	Protocol          Protocol        `json:"protocol"`
	Host              string          `json:"host"`
	Port              int             `json:"port"`
	KeepAlive         int             `json:"keepalive"`
	ConnectTimeout    int             `json:"connect_timeout"`
	Reconnect         bool            `json:"reconnect"`
	ReconnectPeriod   int             `json:"reconnect_period"`
	Username          string          `json:"username,omitempty"`
	Password          string          `json:"password,omitempty"`
	Path              string          `json:"path,omitempty"`
	SSL               bool            `json:"ssl"`
	MQTTVersion       string          `json:"mqtt_version"`
	UnreadMessageCount int            `json:"unread_message_count"`
	ClientIDWithTime  bool            `json:"client_id_with_time"`
	OrderID           int             `json:"order_id"`
	IsCollection      bool            `json:"is_collection"`
	ParentID          string          `json:"parent_id,omitempty"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`

	// TLS/certificate fields
	CertType          CertType `json:"cert_type,omitempty"`
	RejectUnauthorized bool    `json:"reject_unauthorized"`
	ALPNProtocols     string   `json:"alpn_protocols,omitempty"`
	CA                string   `json:"ca,omitempty"`
	Cert              string   `json:"cert,omitempty"`
	Key               string   `json:"key,omitempty"`

	// MQTT 5 connection properties (stored as JSON blob)
	MQTT5Properties *MQTT5Properties `json:"mqtt5_properties,omitempty"`

	// MQTT 5 default publish properties (stored as JSON blob)
	PushProps *PushProperties `json:"push_props,omitempty"`
}

// Protocol represents the MQTT connection protocol.
type Protocol string

const (
	ProtocolMQTT  Protocol = "mqtt"
	ProtocolMQTTS Protocol = "mqtts"
	ProtocolWS    Protocol = "ws"
	ProtocolWSS   Protocol = "wss"
)

// CertType represents the TLS certificate type.
type CertType string

const (
	CertTypeNone   CertType = ""
	CertTypeServer CertType = "server"
	CertTypeSelf   CertType = "self"
)

// MQTT5Properties holds MQTT 5.0 connection properties.
type MQTT5Properties struct {
	SessionExpiryInterval      *int              `json:"session_expiry_interval,omitempty"`
	ReceiveMaximum             *int              `json:"receive_maximum,omitempty"`
	MaximumPacketSize          *int              `json:"maximum_packet_size,omitempty"`
	TopicAliasMaximum          *int              `json:"topic_alias_maximum,omitempty"`
	RequestResponseInformation *bool             `json:"request_response_information,omitempty"`
	RequestProblemInformation  *bool             `json:"request_problem_information,omitempty"`
	UserProperties             map[string]string `json:"user_properties,omitempty"`
	AuthenticationMethod       string            `json:"authentication_method,omitempty"`
	AuthenticationData         string            `json:"authentication_data,omitempty"`
}

// PushProperties holds MQTT 5.0 default publish properties.
type PushProperties struct {
	PayloadFormatIndicator   *bool             `json:"payload_format_indicator,omitempty"`
	MessageExpiryInterval    *int              `json:"message_expiry_interval,omitempty"`
	TopicAlias               *int              `json:"topic_alias,omitempty"`
	ResponseTopic            string            `json:"response_topic,omitempty"`
	CorrelationData          string            `json:"correlation_data,omitempty"`
	UserProperties           map[string]string `json:"user_properties,omitempty"`
	SubscriptionIdentifier   *int              `json:"subscription_identifier,omitempty"`
	ContentType              string            `json:"content_type,omitempty"`
}

// ConnectionFilter defines query filters for listing connections.
type ConnectionFilter struct {
	ParentID *string
}

// ToJSON marshals a value to JSON bytes, returning nil for nil pointers.
func ToJSON(v interface{}) json.RawMessage {
	if v == nil {
		return nil
	}
	b, err := json.Marshal(v)
	if err != nil {
		return nil
	}
	return b
}

// FromJSON unmarshals JSON bytes into a target value.
func FromJSON(data json.RawMessage, v interface{}) error {
	if len(data) == 0 {
		return nil
	}
	return json.Unmarshal(data, v)
}

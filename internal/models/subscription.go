package models

import (
	"encoding/json"
	"time"
)

// RetainHandling controls how retained messages are delivered on subscribe.
type RetainHandling int

const (
	RetainSendAlways RetainHandling = 0
	RetainSendNew    RetainHandling = 1
	RetainDoNotSend  RetainHandling = 2
)

// Subscription represents a saved MQTT topic subscription.
type Subscription struct {
	ID                   string    `json:"id"`
	Topic                string    `json:"topic"`
	QoS                  QoS       `json:"qos"`
	Disabled             bool      `json:"disabled"`
	Alias                string    `json:"alias,omitempty"`
	Retain               bool      `json:"retain"`
	NL                   bool      `json:"nl"`                    // No Local
	RAP                  bool      `json:"rap"`                   // Retain As Published
	RH                   RetainHandling `json:"rh"`               // Retain Handling
	SubscriptionIdentifier *int    `json:"subscription_identifier,omitempty"`
	UserProperties       map[string]string `json:"user_properties,omitempty"`
	Color                string    `json:"color,omitempty"`
	CreatedAt            time.Time `json:"created_at"`
	ConnectionID         string    `json:"connection_id"`
}

// MarshalUserPropertiesJSON marshals subscription user properties to JSON bytes.
func (s *Subscription) MarshalUserPropertiesJSON() json.RawMessage {
	return MarshalUserProperties(s.UserProperties)
}

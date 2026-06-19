package mqtt

import (
	"context"
	"time"

	"github.com/nictoarch/mqtts/internal/models"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// Event names emitted to the frontend via Wails runtime.
const (
	EventConnectionStatus = "mqtt:connection:status"
	EventMessageReceived  = "mqtt:message:received"
	EventMessagePublished = "mqtt:message:published"
	EventError            = "mqtt:error"
	EventLog              = "mqtt:log"
)

// ConnectionStatus represents the state of an MQTT connection.
type ConnectionStatus string

const (
	StatusConnecting    ConnectionStatus = "connecting"
	StatusConnected     ConnectionStatus = "connected"
	StatusDisconnecting ConnectionStatus = "disconnecting"
	StatusDisconnected  ConnectionStatus = "disconnected"
	StatusError         ConnectionStatus = "error"
)

// ConnectionStatusEvent is emitted when a connection's status changes.
type ConnectionStatusEvent struct {
	ConnectionID string           `json:"connectionId"`
	Status       ConnectionStatus `json:"status"`
	Error        string           `json:"error,omitempty"`
	Timestamp    string           `json:"timestamp"`
}

// MessageReceivedEvent is emitted when a message is received or published.
type MessageReceivedEvent struct {
	ConnectionID string         `json:"connectionId"`
	Message      models.Message `json:"message"`
}

// MqttErrorEvent is emitted on protocol or connection errors.
type MqttErrorEvent struct {
	ConnectionID string `json:"connectionId,omitempty"`
	Code         string `json:"code"`
	Message      string `json:"message"`
	Detail       string `json:"detail,omitempty"`
}

// LogEvent is emitted for debug/info logging.
type LogEvent struct {
	ConnectionID string `json:"connectionId,omitempty"`
	Level        string `json:"level"`
	Message      string `json:"message"`
	Timestamp    string `json:"timestamp"`
}

// EventEmitter wraps Wails runtime event emission.
type EventEmitter struct {
	ctx context.Context
}

// NewEventEmitter creates an EventEmitter bound to a Wails context.
func NewEventEmitter(ctx context.Context) *EventEmitter {
	return &EventEmitter{ctx: ctx}
}

func (e *EventEmitter) emitConnectionStatus(connID string, status ConnectionStatus, errStr string) {
	if e.ctx == nil {
		return
	}
	wailsRuntime.EventsEmit(e.ctx, EventConnectionStatus, ConnectionStatusEvent{
		ConnectionID: connID,
		Status:       status,
		Error:        errStr,
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
	})
}

func (e *EventEmitter) emitMessageReceived(connID string, msg models.Message) {
	if e.ctx == nil {
		return
	}
	wailsRuntime.EventsEmit(e.ctx, EventMessageReceived, MessageReceivedEvent{
		ConnectionID: connID,
		Message:      msg,
	})
}

func (e *EventEmitter) emitMessagePublished(connID string, msg models.Message) {
	if e.ctx == nil {
		return
	}
	wailsRuntime.EventsEmit(e.ctx, EventMessagePublished, MessageReceivedEvent{
		ConnectionID: connID,
		Message:      msg,
	})
}

func (e *EventEmitter) emitError(connID, code, message, detail string) {
	if e.ctx == nil {
		return
	}
	wailsRuntime.EventsEmit(e.ctx, EventError, MqttErrorEvent{
		ConnectionID: connID,
		Code:         code,
		Message:      message,
		Detail:       detail,
	})
}

func (e *EventEmitter) emitLog(connID, level, message string) {
	if e.ctx == nil {
		return
	}
	wailsRuntime.EventsEmit(e.ctx, EventLog, LogEvent{
		ConnectionID: connID,
		Level:        level,
		Message:      message,
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
	})
}

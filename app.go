package main

import (
	"context"
	"fmt"
	"runtime"

	mqtt "github.com/nictoarch/mqtts/internal/mqtt"
	"github.com/nictoarch/mqtts/internal/models"
	"github.com/nictoarch/mqtts/internal/storage"
)

type App struct {
	ctx   context.Context
	store *storage.Store
	mqtt  *mqtt.Manager
}

func NewApp(store *storage.Store) *App {
	return &App{store: store}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.mqtt = mqtt.NewManager(ctx, a.store)
}

// Greet is the frontend/backend bridge smoke test.
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s! mqtts is running on %s/%s.", name, runtime.GOOS, runtime.GOARCH)
}

// --- Connection methods exposed to frontend ---

// ListConnections returns all saved connections.
func (a *App) ListConnections() ([]models.Connection, error) {
	return a.store.Connections.List(a.ctx)
}

// GetConnection returns a connection by ID.
func (a *App) GetConnection(id string) (*models.Connection, error) {
	return a.store.Connections.Get(a.ctx, id)
}

// CreateConnection saves a new connection.
func (a *App) CreateConnection(c *models.Connection) error {
	return a.store.Connections.Create(a.ctx, c)
}

// UpdateConnection updates an existing connection.
func (a *App) UpdateConnection(c *models.Connection) error {
	return a.store.Connections.Update(a.ctx, c)
}

// DeleteConnection removes a connection and its cascaded data.
func (a *App) DeleteConnection(id string) error {
	// Disconnect if connected
	if a.mqtt.IsConnected(id) {
		a.mqtt.Disconnect(id)
	}
	return a.store.Connections.Delete(a.ctx, id)
}

// --- MQTT methods exposed to frontend ---

// Connect establishes an MQTT connection.
func (a *App) Connect(id string) error {
	return a.mqtt.Connect(id)
}

// Disconnect disconnects an MQTT connection.
func (a *App) Disconnect(id string) error {
	return a.mqtt.Disconnect(id)
}

// PublishInput represents the input for publishing a message.
type PublishInput struct {
	ConnectionID string `json:"connectionId"`
	Topic        string `json:"topic"`
	Payload      string `json:"payload"`
	QoS          int    `json:"qos"`
	Retain       bool   `json:"retain"`
}

// Publish sends an MQTT message.
func (a *App) Publish(input PublishInput) error {
	return a.mqtt.Publish(input.ConnectionID, input.Topic, input.Payload, byte(input.QoS), input.Retain)
}

// SubscribeInput represents the input for subscribing to a topic.
type SubscribeInput struct {
	ConnectionID string `json:"connectionId"`
	Topic        string `json:"topic"`
	QoS          int    `json:"qos"`
}

// Subscribe subscribes to an MQTT topic.
func (a *App) Subscribe(input SubscribeInput) error {
	return a.mqtt.Subscribe(input.ConnectionID, input.Topic, byte(input.QoS))
}

// UnsubscribeInput represents the input for unsubscribing from a topic.
type UnsubscribeInput struct {
	ConnectionID string `json:"connectionId"`
	Topic        string `json:"topic"`
}

// Unsubscribe unsubscribes from an MQTT topic.
func (a *App) Unsubscribe(input UnsubscribeInput) error {
	return a.mqtt.Unsubscribe(input.ConnectionID, input.Topic)
}

// IsConnected returns whether a connection is currently active.
func (a *App) IsConnected(id string) bool {
	return a.mqtt.IsConnected(id)
}

// --- Settings methods exposed to frontend ---

// GetSettings returns the application settings.
func (a *App) GetSettings() (*models.Settings, error) {
	return a.store.Settings.Get(a.ctx)
}

// UpdateSettings persists application settings changes.
func (a *App) UpdateSettings(s *models.Settings) error {
	return a.store.Settings.Update(a.ctx, s)
}

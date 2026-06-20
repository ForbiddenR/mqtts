package main

import (
	"context"
	"encoding/json"
	"fmt"
	"runtime"

	mqtt "github.com/nictoarch/mqtts/internal/mqtt"
	"github.com/nictoarch/mqtts/internal/models"
	"github.com/nictoarch/mqtts/internal/security"
	"github.com/nictoarch/mqtts/internal/storage"
)

type App struct {
	ctx   context.Context
	store *storage.Store
	mqtt  *mqtt.Manager
	creds security.CredentialStore
}

func NewApp(store *storage.Store, creds security.CredentialStore) *App {
	return &App{store: store, creds: creds}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.mqtt = mqtt.NewManager(ctx, a.store, a.creds)
}

// Greet is the frontend/backend bridge smoke test.
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s! mqtts is running on %s/%s.", name, runtime.GOOS, runtime.GOARCH)
}

// --- Connection methods exposed to frontend ---

// ListConnections returns all saved connections.
// Sensitive fields (password, TLS key) are stored in the OS keychain, not in SQLite.
func (a *App) ListConnections() ([]models.Connection, error) {
	conns, err := a.store.Connections.List(a.ctx)
	if err != nil {
		return nil, err
	}
	// Fill in passwords from keychain
	for i := range conns {
		a.hydrateCredentials(&conns[i])
	}
	return conns, nil
}

// GetConnection returns a connection by ID.
func (a *App) GetConnection(id string) (*models.Connection, error) {
	conn, err := a.store.Connections.Get(a.ctx, id)
	if err != nil {
		return nil, err
	}
	a.hydrateCredentials(conn)
	return conn, nil
}

// CreateConnection saves a new connection.
// Password and TLS key are stored in the OS keychain; the SQLite row stores an empty string.
func (a *App) CreateConnection(c *models.Connection) error {
	a.extractCredentials(c)
	return a.store.Connections.Create(a.ctx, c)
}

// UpdateConnection updates an existing connection.
func (a *App) UpdateConnection(c *models.Connection) error {
	a.extractCredentials(c)
	return a.store.Connections.Update(a.ctx, c)
}

// DeleteConnection removes a connection and its cascaded data.
func (a *App) DeleteConnection(id string) error {
	// Disconnect if connected
	if a.mqtt.IsConnected(id) {
		a.mqtt.Disconnect(id)
	}
	// Delete credentials from keychain
	_ = a.creds.DeleteAll(id)
	return a.store.Connections.Delete(a.ctx, id)
}

// extractCredentials moves sensitive fields from the connection model into the credential store.
func (a *App) extractCredentials(c *models.Connection) {
	if c.Password != "" {
		_ = a.creds.Store(c.ID, "password", c.Password)
		c.Password = ""
	}
	if c.Key != "" {
		_ = a.creds.Store(c.ID, "key", c.Key)
		c.Key = ""
	}
}

// hydrateCredentials fills sensitive fields back into the connection model from the credential store.
func (a *App) hydrateCredentials(c *models.Connection) {
	if pwd, err := a.creds.Retrieve(c.ID, "password"); err == nil && pwd != "" {
		c.Password = pwd
	}
	if key, err := a.creds.Retrieve(c.ID, "key"); err == nil && key != "" {
		c.Key = key
	}
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

// GetConnectionStats returns real-time statistics for a connection.
func (a *App) GetConnectionStats(id string) mqtt.ConnectionStats {
	return a.mqtt.GetStats(id)
}

// GetAllConnectionStats returns statistics for all active connections.
func (a *App) GetAllConnectionStats() []mqtt.ConnectionStats {
	return a.mqtt.GetAllStats()
}

// --- Subscription methods exposed to frontend ---

// ListSubscriptions returns all subscriptions for a connection.
func (a *App) ListSubscriptions(connID string) ([]models.Subscription, error) {
	return a.store.Subscriptions.ListByConnection(a.ctx, connID)
}

// CreateSubscription saves a new subscription.
func (a *App) CreateSubscription(s *models.Subscription) error {
	return a.store.Subscriptions.Create(a.ctx, s)
}

// UpdateSubscription updates an existing subscription.
func (a *App) UpdateSubscription(s *models.Subscription) error {
	return a.store.Subscriptions.Update(a.ctx, s)
}

// DeleteSubscription removes a subscription by ID.
func (a *App) DeleteSubscription(id string) error {
	return a.store.Subscriptions.Delete(a.ctx, id)
}

// --- Message methods exposed to frontend ---

// ListMessagesInput represents pagination input for listing messages.
type ListMessagesInput struct {
	ConnectionID string `json:"connectionId"`
	Limit        int    `json:"limit"`
	Offset       int    `json:"offset"`
}

// ListMessagesResult represents paginated message results.
type ListMessagesResult struct {
	Messages []models.Message `json:"messages"`
	Total    int              `json:"total"`
}

// ListMessages returns paginated messages for a connection.
func (a *App) ListMessages(input ListMessagesInput) (*ListMessagesResult, error) {
	msgs, total, err := a.store.Messages.ListByConnection(a.ctx, input.ConnectionID, input.Limit, input.Offset)
	if err != nil {
		return nil, err
	}
	return &ListMessagesResult{Messages: msgs, Total: total}, nil
}

// DeleteMessagesByConnection removes all messages for a connection.
func (a *App) DeleteMessagesByConnection(connID string) error {
	return a.store.Messages.DeleteByConnection(a.ctx, connID)
}

// --- Publish history methods exposed to frontend ---

// ListPublishHeaders returns publish history headers for a connection.
func (a *App) ListPublishHeaders(connID string) ([]models.PublishHistoryHeader, error) {
	return a.store.PublishHistory.ListHeaders(a.ctx, connID)
}

// ListPublishPayloads returns publish history payloads for a connection.
func (a *App) ListPublishPayloads(connID string) ([]models.PublishHistoryPayload, error) {
	return a.store.PublishHistory.ListPayloads(a.ctx, connID)
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

// --- Payload template methods ---

// GetPayloadTemplates returns the saved payload templates.
func (a *App) GetPayloadTemplates() ([]models.PayloadTemplate, error) {
	s, err := a.store.Settings.Get(a.ctx)
	if err != nil {
		return nil, err
	}
	return s.PayloadTemplates, nil
}

// SavePayloadTemplate adds or updates a payload template.
func (a *App) SavePayloadTemplate(t models.PayloadTemplate) error {
	s, err := a.store.Settings.Get(a.ctx)
	if err != nil {
		return err
	}
	found := false
	for i, existing := range s.PayloadTemplates {
		if existing.Name == t.Name {
			s.PayloadTemplates[i] = t
			found = true
			break
		}
	}
	if !found {
		s.PayloadTemplates = append(s.PayloadTemplates, t)
	}
	return a.store.Settings.Update(a.ctx, s)
}

// DeletePayloadTemplate removes a payload template by name.
func (a *App) DeletePayloadTemplate(name string) error {
	s, err := a.store.Settings.Get(a.ctx)
	if err != nil {
		return err
	}
	for i, t := range s.PayloadTemplates {
		if t.Name == name {
			s.PayloadTemplates = append(s.PayloadTemplates[:i], s.PayloadTemplates[i+1:]...)
			break
		}
	}
	return a.store.Settings.Update(a.ctx, s)
}

// --- Topic alias methods ---

// GetTopicAliases returns the topic alias map.
func (a *App) GetTopicAliases() (map[string]string, error) {
	s, err := a.store.Settings.Get(a.ctx)
	if err != nil {
		return nil, err
	}
	if s.TopicAliases == nil {
		return map[string]string{}, nil
	}
	return s.TopicAliases, nil
}

// SetTopicAlias adds or updates a topic alias.
func (a *App) SetTopicAlias(alias string, topic string) error {
	s, err := a.store.Settings.Get(a.ctx)
	if err != nil {
		return err
	}
	if s.TopicAliases == nil {
		s.TopicAliases = make(map[string]string)
	}
	s.TopicAliases[alias] = topic
	return a.store.Settings.Update(a.ctx, s)
}

// DeleteTopicAlias removes a topic alias.
func (a *App) DeleteTopicAlias(alias string) error {
	s, err := a.store.Settings.Get(a.ctx)
	if err != nil {
		return err
	}
	if s.TopicAliases == nil {
		return nil
	}
	delete(s.TopicAliases, alias)
	return a.store.Settings.Update(a.ctx, s)
}

// --- Import/Export ---

// ExportData represents the full export payload.
type ExportData struct {
	Connections  []models.Connection   `json:"connections"`
	Subscriptions []models.Subscription `json:"subscriptions"`
}

// ExportAll exports all connections and their subscriptions as JSON.
func (a *App) ExportAll() (string, error) {
	conns, err := a.store.Connections.List(a.ctx)
	if err != nil {
		return "", fmt.Errorf("list connections: %w", err)
	}

	var allSubs []models.Subscription
	for _, c := range conns {
		subs, err := a.store.Subscriptions.ListByConnection(a.ctx, c.ID)
		if err != nil {
			return "", fmt.Errorf("list subscriptions for %s: %w", c.ID, err)
		}
		allSubs = append(allSubs, subs...)
	}

	data := ExportData{
		Connections:   conns,
		Subscriptions: allSubs,
	}

	b, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return "", fmt.Errorf("marshal export: %w", err)
	}
	return string(b), nil
}

// ImportResult represents the result of an import operation.
type ImportResult struct {
	ConnectionsImported   int `json:"connectionsImported"`
	SubscriptionsImported int `json:"subscriptionsImported"`
	Errors                []string `json:"errors,omitempty"`
}

// ImportAll imports connections and subscriptions from a JSON string.
func (a *App) ImportAll(jsonStr string) (*ImportResult, error) {
	var data ExportData
	if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
		return nil, fmt.Errorf("parse import data: %w", err)
	}

	result := &ImportResult{}

	// Build old-ID to new-ID mapping for connections
	idMap := make(map[string]string)

	for _, conn := range data.Connections {
		oldID := conn.ID
		conn.ID = ""
		if err := a.store.Connections.Create(a.ctx, &conn); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("import connection %s: %v", conn.Name, err))
			continue
		}
		idMap[oldID] = conn.ID
		result.ConnectionsImported++
	}

	for _, sub := range data.Subscriptions {
		newConnID, ok := idMap[sub.ConnectionID]
		if !ok {
			result.Errors = append(result.Errors, fmt.Sprintf("skip subscription %s: connection not found", sub.Topic))
			continue
		}
		sub.ID = ""
		sub.ConnectionID = newConnID
		if err := a.store.Subscriptions.Create(a.ctx, &sub); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("import subscription %s: %v", sub.Topic, err))
			continue
		}
		result.SubscriptionsImported++
	}

	return result, nil
}

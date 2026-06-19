package mqtt

import (
	"context"
	"fmt"
	"sync"

	"github.com/nictoarch/mqtts/internal/models"
	"github.com/nictoarch/mqtts/internal/storage"
)

// Manager manages multiple concurrent MQTT client sessions.
type Manager struct {
	mu      sync.RWMutex
	clients map[string]*ClientSession
	store   *storage.Store
	events  *EventEmitter
	ctx     context.Context
}

// NewManager creates a new MQTT Manager.
func NewManager(ctx context.Context, store *storage.Store) *Manager {
	return &Manager{
		clients: make(map[string]*ClientSession),
		store:   store,
		events:  NewEventEmitter(ctx),
		ctx:     ctx,
	}
}

// Connect establishes an MQTT connection for the given connection ID.
func (m *Manager) Connect(connID string) error {
	m.mu.RLock()
	if session, ok := m.clients[connID]; ok && session.IsConnected() {
		m.mu.RUnlock()
		return fmt.Errorf("already connected")
	}
	m.mu.RUnlock()

	// Load connection from database
	conn, err := m.store.Connections.Get(m.ctx, connID)
	if err != nil {
		return fmt.Errorf("load connection: %w", err)
	}

	// Load will if exists
	var will *models.Will
	w, err := m.store.Wills.GetByConnection(m.ctx, connID)
	if err != nil && err.Error() != "scan will: sql: no rows in result set" {
		// Will not found is OK
		will = nil
	} else if err == nil {
		will = w
	}

	// Create new session
	session := NewClientSession(connID, conn, will, m)

	// Store session
	m.mu.Lock()
	m.clients[connID] = session
	m.mu.Unlock()

	// Connect
	if err := session.Connect(m.ctx); err != nil {
		m.mu.Lock()
		delete(m.clients, connID)
		m.mu.Unlock()
		return err
	}

	return nil
}

// Disconnect disconnects the MQTT client for the given connection ID.
func (m *Manager) Disconnect(connID string) error {
	m.mu.RLock()
	session, ok := m.clients[connID]
	m.mu.RUnlock()

	if !ok {
		return fmt.Errorf("no session for connection %s", connID)
	}

	return session.Disconnect()
}

// Publish sends an MQTT message.
func (m *Manager) Publish(connID, topic, payload string, qos byte, retain bool) error {
	m.mu.RLock()
	session, ok := m.clients[connID]
	m.mu.RUnlock()

	if !ok {
		return fmt.Errorf("no session for connection %s", connID)
	}

	return session.Publish(topic, payload, qos, retain)
}

// Subscribe subscribes to an MQTT topic.
func (m *Manager) Subscribe(connID, topic string, qos byte) error {
	m.mu.RLock()
	session, ok := m.clients[connID]
	m.mu.RUnlock()

	if !ok {
		return fmt.Errorf("no session for connection %s", connID)
	}

	// Try to load existing subscription from database
	subs, err := m.store.Subscriptions.ListByConnection(m.ctx, connID)
	if err != nil {
		return fmt.Errorf("list subscriptions: %w", err)
	}

	var sub *models.Subscription
	for _, s := range subs {
		if s.Topic == topic {
			sub = &s
			break
		}
	}

	return session.Subscribe(topic, qos, sub)
}

// Unsubscribe unsubscribes from an MQTT topic.
func (m *Manager) Unsubscribe(connID, topic string) error {
	m.mu.RLock()
	session, ok := m.clients[connID]
	m.mu.RUnlock()

	if !ok {
		return fmt.Errorf("no session for connection %s", connID)
	}

	return session.Unsubscribe(topic)
}

// IsConnected returns whether the given connection is currently active.
func (m *Manager) IsConnected(connID string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	session, ok := m.clients[connID]
	if !ok {
		return false
	}
	return session.IsConnected()
}

// DisconnectAll disconnects all active sessions.
func (m *Manager) DisconnectAll() {
	m.mu.RLock()
	sessions := make([]*ClientSession, 0, len(m.clients))
	for _, s := range m.clients {
		sessions = append(sessions, s)
	}
	m.mu.RUnlock()

	for _, s := range sessions {
		s.Disconnect()
	}
}

// GetStore returns the storage store.
func (m *Manager) GetStore() *storage.Store {
	return m.store
}

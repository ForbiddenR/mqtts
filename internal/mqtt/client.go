package mqtt

import (
	"context"
	"crypto/tls"
	"fmt"
	"net"
	"sync/atomic"
	"time"

	"github.com/eclipse/paho.golang/paho"
	"github.com/nictoarch/mqtts/internal/models"
)

// ClientSession wraps a Paho MQTT client for a single connection.
type ClientSession struct {
	id        string
	conn      *models.Connection
	will      *models.Will
	client    *paho.Client
	manager   *Manager
	connected atomic.Bool
	cancel    context.CancelFunc
}

// NewClientSession creates a new ClientSession.
func NewClientSession(id string, conn *models.Connection, will *models.Will, manager *Manager) *ClientSession {
	return &ClientSession{
		id:      id,
		conn:    conn,
		will:    will,
		manager: manager,
	}
}

// Connect establishes the MQTT connection.
func (cs *ClientSession) Connect(ctx context.Context) error {
	if cs.connected.Load() {
		return fmt.Errorf("already connected")
	}

	cs.manager.events.emitConnectionStatus(cs.id, StatusConnecting, "")

	// Build connect packet
	cp, err := BuildConnectPacket(cs.conn, cs.will)
	if err != nil {
		cs.manager.events.emitConnectionStatus(cs.id, StatusError, err.Error())
		return fmt.Errorf("build connect packet: %w", err)
	}

	// Build server URL
	serverURL, err := BuildServerURL(cs.conn)
	if err != nil {
		cs.manager.events.emitConnectionStatus(cs.id, StatusError, err.Error())
		return fmt.Errorf("build server URL: %w", err)
	}

	// Build TLS config
	tlsConfig, err := BuildTLSConfig(cs.conn)
	if err != nil {
		cs.manager.events.emitConnectionStatus(cs.id, StatusError, err.Error())
		return fmt.Errorf("build TLS config: %w", err)
	}

	// Establish network connection
	dialer := &net.Dialer{
		Timeout: time.Duration(cs.conn.ConnectTimeout) * time.Second,
	}

	netConn, err := dialContext(ctx, serverURL, tlsConfig, dialer)
	if err != nil {
		cs.manager.events.emitConnectionStatus(cs.id, StatusError, err.Error())
		return fmt.Errorf("dial: %w", err)
	}

	// Create Paho client config
	config := &paho.ClientConfig{
		ClientID: cp.ClientID,
		Conn:     netConn,
		Router:   paho.NewStandardRouterWithDefault(cs.handleMessage),
		OnServerDisconnect: func(d *paho.Disconnect) {
			cs.connected.Store(false)
			cs.manager.events.emitConnectionStatus(cs.id, StatusDisconnected, fmt.Sprintf("server disconnect: %v", d.ReasonCode))
		},
	}

	// Create Paho client
	cs.client = paho.NewClient(*config)

	// Connect
	connCtx, connCancel := context.WithTimeout(ctx, time.Duration(cs.conn.ConnectTimeout)*time.Second)
	defer connCancel()

	connAck, err := cs.client.Connect(connCtx, cp)
	if err != nil {
		netConn.Close()
		cs.manager.events.emitConnectionStatus(cs.id, StatusError, err.Error())
		return fmt.Errorf("connect: %w", err)
	}

	if connAck.ReasonCode != 0 {
		netConn.Close()
		errMsg := fmt.Sprintf("connection refused: reason code %d", connAck.ReasonCode)
		cs.manager.events.emitConnectionStatus(cs.id, StatusError, errMsg)
		return fmt.Errorf("%s", errMsg)
	}

	cs.connected.Store(true)
	cs.manager.events.emitConnectionStatus(cs.id, StatusConnected, "")
	cs.manager.events.emitLog(cs.id, "info", "connected to broker")

	return nil
}

// Disconnect gracefully disconnects from the broker.
func (cs *ClientSession) Disconnect() error {
	if !cs.connected.Load() {
		return nil
	}

	cs.manager.events.emitConnectionStatus(cs.id, StatusDisconnecting, "")

	if cs.client != nil {
		cs.client.Disconnect(&paho.Disconnect{})
	}

	if cs.cancel != nil {
		cs.cancel()
	}

	cs.connected.Store(false)
	cs.manager.events.emitConnectionStatus(cs.id, StatusDisconnected, "")
	cs.manager.events.emitLog(cs.id, "info", "disconnected from broker")

	return nil
}

// Publish sends a message to the broker.
func (cs *ClientSession) Publish(topic, payload string, qos byte, retain bool) error {
	if !cs.connected.Load() {
		return fmt.Errorf("not connected")
	}

	pub := BuildPublishPacket(topic, payload, qos, retain, cs.conn)

	_, err := cs.client.Publish(context.Background(), pub)
	if err != nil {
		return fmt.Errorf("publish: %w", err)
	}

	// Create message for storage and events
	msg := models.Message{
		Topic:        topic,
		Payload:      payload,
		QoS:          models.QoS(qos),
		Retain:       retain,
		Out:          true,
		ConnectionID: cs.id,
		CreatedAt:    time.Now(),
	}

	// Persist the published message
	if err := cs.manager.store.Messages.Create(context.Background(), &msg); err != nil {
		cs.manager.events.emitLog(cs.id, "warn", fmt.Sprintf("failed to persist published message: %v", err))
	}

	// Emit published event
	cs.manager.events.emitMessagePublished(cs.id, msg)
	cs.manager.events.emitLog(cs.id, "debug", fmt.Sprintf("published to %s", topic))

	return nil
}

// Subscribe subscribes to a topic.
func (cs *ClientSession) Subscribe(topic string, qos byte, sub *models.Subscription) error {
	if !cs.connected.Load() {
		return fmt.Errorf("not connected")
	}

	subscribe := BuildSubscribePacket(topic, qos, sub)

	_, err := cs.client.Subscribe(context.Background(), subscribe)
	if err != nil {
		return fmt.Errorf("subscribe: %w", err)
	}

	cs.manager.events.emitLog(cs.id, "info", fmt.Sprintf("subscribed to %s (QoS %d)", topic, qos))

	return nil
}

// Unsubscribe removes a subscription.
func (cs *ClientSession) Unsubscribe(topic string) error {
	if !cs.connected.Load() {
		return fmt.Errorf("not connected")
	}

	unsub := &paho.Unsubscribe{
		Topics: []string{topic},
	}

	_, err := cs.client.Unsubscribe(context.Background(), unsub)
	if err != nil {
		return fmt.Errorf("unsubscribe: %w", err)
	}

	cs.manager.events.emitLog(cs.id, "info", fmt.Sprintf("unsubscribed from %s", topic))

	return nil
}

// IsConnected returns whether the session is currently connected.
func (cs *ClientSession) IsConnected() bool {
	return cs.connected.Load()
}

// handleMessage processes incoming MQTT messages.
func (cs *ClientSession) handleMessage(publish *paho.Publish) {
	msg := models.Message{
		Topic:        publish.Topic,
		Payload:      string(publish.Payload),
		QoS:          models.QoS(publish.QoS),
		Retain:       publish.Retain,
		Out:          false,
		ConnectionID: cs.id,
		CreatedAt:    time.Now(),
	}

	// Set MQTT 5 properties if present
	if publish.Properties != nil {
		if publish.Properties.PayloadFormat != nil {
			v := *publish.Properties.PayloadFormat != 0
			msg.PayloadFormatIndicator = &v
		}
		if publish.Properties.MessageExpiry != nil {
			v := int(*publish.Properties.MessageExpiry)
			msg.MessageExpiryInterval = &v
		}
		if publish.Properties.TopicAlias != nil {
			v := int(*publish.Properties.TopicAlias)
			msg.TopicAlias = &v
		}
		if publish.Properties.ResponseTopic != "" {
			msg.ResponseTopic = publish.Properties.ResponseTopic
		}
		if publish.Properties.CorrelationData != nil {
			msg.CorrelationData = string(publish.Properties.CorrelationData)
		}
		if publish.Properties.ContentType != "" {
			msg.ContentType = publish.Properties.ContentType
		}
		if publish.Properties.SubscriptionIdentifier != nil {
			v := *publish.Properties.SubscriptionIdentifier
			msg.SubscriptionIdentifier = &v
		}
		if publish.Properties.User != nil {
			msg.UserProperties = make(map[string]string)
			for _, up := range publish.Properties.User {
				msg.UserProperties[up.Key] = up.Value
			}
		}
	}

	// Persist the message
	if err := cs.manager.store.Messages.Create(context.Background(), &msg); err != nil {
		cs.manager.events.emitLog(cs.id, "warn", fmt.Sprintf("failed to persist received message: %v", err))
	}

	// Increment unread count
	if err := cs.manager.store.Connections.IncrementUnread(context.Background(), cs.id); err != nil {
		cs.manager.events.emitLog(cs.id, "warn", fmt.Sprintf("failed to increment unread count: %v", err))
	}

	// Emit received event
	cs.manager.events.emitMessageReceived(cs.id, msg)
	cs.manager.events.emitLog(cs.id, "debug", fmt.Sprintf("received message on %s", publish.Topic))
}

// dialContext establishes a network connection based on the server URL scheme.
func dialContext(ctx context.Context, serverURL string, tlsConfig *tls.Config, dialer *net.Dialer) (net.Conn, error) {
	if len(serverURL) < 6 {
		return nil, fmt.Errorf("invalid server URL: %s", serverURL)
	}

	scheme := serverURL[:6]
	hostPort := serverURL[6:]

	switch scheme {
	case "tcp://":
		return dialer.DialContext(ctx, "tcp", hostPort)
	case "ssl://":
		if tlsConfig != nil {
			return tls.DialWithDialer(dialer, "tcp", hostPort, tlsConfig)
		}
		return dialer.DialContext(ctx, "tcp", hostPort)
	default:
		// For WebSocket URLs (ws://, wss://), we need a different approach
		// This will be implemented when WebSocket support is added
		return nil, fmt.Errorf("unsupported URL scheme: %s", scheme)
	}
}

package storage_test

import (
	"context"
	"testing"

	"github.com/nictoarch/mqtts/internal/models"
	"github.com/nictoarch/mqtts/internal/storage"
)

func setupTestDB(t *testing.T) *storage.Store {
	t.Helper()
	db, err := storage.Open(":memory:")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	t.Cleanup(func() { db.Close() })

	if err := db.Migrate(); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return storage.NewStore(db)
}

func TestConnectionCRUD(t *testing.T) {
	store := setupTestDB(t)
	ctx := context.Background()

	conn := &models.Connection{
		ClientID:    "test-client",
		Name:        "Test Broker",
		Host:        "localhost",
		Port:        1883,
		Protocol:    models.ProtocolMQTT,
		MQTTVersion: "3.1.1",
		Clean:       true,
		KeepAlive:   60,
	}

	// Create
	if err := store.Connections.Create(ctx, conn); err != nil {
		t.Fatalf("create: %v", err)
	}
	if conn.ID == "" {
		t.Fatal("expected ID to be set")
	}

	// Get
	got, err := store.Connections.Get(ctx, conn.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.ClientID != "test-client" {
		t.Errorf("client_id = %q, want %q", got.ClientID, "test-client")
	}
	if got.Host != "localhost" {
		t.Errorf("host = %q, want %q", got.Host, "localhost")
	}

	// List
	list, err := store.Connections.List(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("list len = %d, want 1", len(list))
	}

	// Update
	conn.Name = "Updated Broker"
	if err := store.Connections.Update(ctx, conn); err != nil {
		t.Fatalf("update: %v", err)
	}
	got, _ = store.Connections.Get(ctx, conn.ID)
	if got.Name != "Updated Broker" {
		t.Errorf("name = %q, want %q", got.Name, "Updated Broker")
	}

	// Delete
	if err := store.Connections.Delete(ctx, conn.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	list, _ = store.Connections.List(ctx)
	if len(list) != 0 {
		t.Errorf("list len after delete = %d, want 0", len(list))
	}
}

func TestConnectionWithMQTT5Properties(t *testing.T) {
	store := setupTestDB(t)
	ctx := context.Background()

	sessionExpiry := 3600
	conn := &models.Connection{
		ClientID:    "mqtt5-client",
		Name:        "MQTT5 Broker",
		Host:        "broker.example.com",
		Port:        8883,
		Protocol:    models.ProtocolMQTTS,
		MQTTVersion: "5.0",
		SSL:         true,
		MQTT5Properties: &models.MQTT5Properties{
			SessionExpiryInterval: &sessionExpiry,
			AuthenticationMethod:  "SCRAM-SHA-256",
		},
	}

	if err := store.Connections.Create(ctx, conn); err != nil {
		t.Fatalf("create: %v", err)
	}

	got, err := store.Connections.Get(ctx, conn.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.MQTT5Properties == nil {
		t.Fatal("expected mqtt5_properties to be set")
	}
	if got.MQTT5Properties.AuthenticationMethod != "SCRAM-SHA-256" {
		t.Errorf("auth method = %q, want %q", got.MQTT5Properties.AuthenticationMethod, "SCRAM-SHA-256")
	}
}

func TestSubscriptionCRUD(t *testing.T) {
	store := setupTestDB(t)
	ctx := context.Background()

	conn := &models.Connection{
		ClientID: "sub-test", Name: "Sub Test", Host: "localhost", Port: 1883,
		Protocol: models.ProtocolMQTT, MQTTVersion: "3.1.1",
	}
	store.Connections.Create(ctx, conn)

	sub := &models.Subscription{
		Topic:        "test/#",
		QoS:          models.QoS1,
		ConnectionID: conn.ID,
		Color:        "#ff0000",
	}

	if err := store.Subscriptions.Create(ctx, sub); err != nil {
		t.Fatalf("create: %v", err)
	}

	subs, err := store.Subscriptions.ListByConnection(ctx, conn.ID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(subs) != 1 {
		t.Fatalf("list len = %d, want 1", len(subs))
	}
	if subs[0].Topic != "test/#" {
		t.Errorf("topic = %q, want %q", subs[0].Topic, "test/#")
	}

	// Delete connection cascades to subscriptions
	store.Connections.Delete(ctx, conn.ID)
	subs, _ = store.Subscriptions.ListByConnection(ctx, conn.ID)
	if len(subs) != 0 {
		t.Errorf("subs after cascade delete = %d, want 0", len(subs))
	}
}

func TestMessageCRUD(t *testing.T) {
	store := setupTestDB(t)
	ctx := context.Background()

	conn := &models.Connection{
		ClientID: "msg-test", Name: "Msg Test", Host: "localhost", Port: 1883,
		Protocol: models.ProtocolMQTT, MQTTVersion: "3.1.1",
	}
	store.Connections.Create(ctx, conn)

	msg := &models.Message{
		Topic:        "sensor/temp",
		Payload:      `{"value": 23.5}`,
		QoS:          models.QoS0,
		Out:          false,
		ConnectionID: conn.ID,
	}

	if err := store.Messages.Create(ctx, msg); err != nil {
		t.Fatalf("create: %v", err)
	}

	msgs, total, err := store.Messages.ListByConnection(ctx, conn.ID, 50, 0)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if total != 1 {
		t.Fatalf("total = %d, want 1", total)
	}
	if msgs[0].Topic != "sensor/temp" {
		t.Errorf("topic = %q, want %q", msgs[0].Topic, "sensor/temp")
	}
}

func TestSettingsDefaults(t *testing.T) {
	store := setupTestDB(t)
	ctx := context.Background()

	s, err := store.Settings.Get(ctx)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if s.CurrentTheme != "light" {
		t.Errorf("theme = %q, want %q", s.CurrentTheme, "light")
	}
	if s.MaxReconnectTimes != 10 {
		t.Errorf("max_reconnect = %d, want 10", s.MaxReconnectTimes)
	}

	s.CurrentTheme = "dark"
	if err := store.Settings.Update(ctx, s); err != nil {
		t.Fatalf("update: %v", err)
	}

	s2, _ := store.Settings.Get(ctx)
	if s2.CurrentTheme != "dark" {
		t.Errorf("theme after update = %q, want %q", s2.CurrentTheme, "dark")
	}
}

func TestWillCRUD(t *testing.T) {
	store := setupTestDB(t)
	ctx := context.Background()

	conn := &models.Connection{
		ClientID: "will-test", Name: "Will Test", Host: "localhost", Port: 1883,
		Protocol: models.ProtocolMQTT, MQTTVersion: "3.1.1",
	}
	store.Connections.Create(ctx, conn)

	will := &models.Will{
		LastWillTopic:   "status/offline",
		LastWillPayload: "goodbye",
		LastWillQoS:     models.QoS1,
		LastWillRetain:  true,
		ConnectionID:    conn.ID,
	}

	if err := store.Wills.Create(ctx, will); err != nil {
		t.Fatalf("create: %v", err)
	}

	got, err := store.Wills.GetByConnection(ctx, conn.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.LastWillTopic != "status/offline" {
		t.Errorf("topic = %q, want %q", got.LastWillTopic, "status/offline")
	}
}

func TestPublishHistory(t *testing.T) {
	store := setupTestDB(t)
	ctx := context.Background()

	h := &models.PublishHistoryHeader{
		Topic: "sensor/humidity", QoS: models.QoS0, Retain: false, ConnectionID: "conn1",
	}
	if err := store.PublishHistory.UpsertHeader(ctx, h); err != nil {
		t.Fatalf("upsert: %v", err)
	}

	// Upsert same key should not error
	if err := store.PublishHistory.UpsertHeader(ctx, h); err != nil {
		t.Fatalf("upsert again: %v", err)
	}

	headers, err := store.PublishHistory.ListHeaders(ctx, "conn1")
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(headers) != 1 {
		t.Fatalf("headers len = %d, want 1", len(headers))
	}
}

func TestCollectionCRUD(t *testing.T) {
	store := setupTestDB(t)
	ctx := context.Background()

	coll := &models.Collection{
		Name:         "Production",
		IsCollection: true,
	}
	if err := store.Collections.Create(ctx, coll); err != nil {
		t.Fatalf("create: %v", err)
	}

	child := &models.Collection{
		Name:         "EU Region",
		IsCollection: true,
		ParentID:     coll.ID,
	}
	if err := store.Collections.Create(ctx, child); err != nil {
		t.Fatalf("create child: %v", err)
	}

	colls, err := store.Collections.List(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(colls) != 2 {
		t.Fatalf("collections len = %d, want 2", len(colls))
	}
}

package main

import (
	"context"
	"fmt"
	"runtime"

	"github.com/nictoarch/mqtts/internal/models"
	"github.com/nictoarch/mqtts/internal/storage"
)

type App struct {
	ctx   context.Context
	store *storage.Store
}

func NewApp(store *storage.Store) *App {
	return &App{store: store}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
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
	return a.store.Connections.Delete(a.ctx, id)
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

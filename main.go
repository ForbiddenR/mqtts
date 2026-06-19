package main

import (
	"embed"
	"log"
	"os"
	"path/filepath"

	"github.com/nictoarch/mqtts/internal/security"
	"github.com/nictoarch/mqtts/internal/storage"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	dbPath := resolveDBPath()

	db, err := storage.Open(dbPath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	if err := db.Migrate(); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	store := storage.NewStore(db)
	creds := security.NewCredentialStore()
	app := NewApp(store, creds)

	err = wails.Run(&options.App{
		Title:  "mqtts",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		log.Fatal(err)
	}
}

// resolveDBPath returns the path to the SQLite database file.
// Uses $XDG_DATA_HOME/mqtts/mqtts.db or ~/.local/share/mqtts/mqtts.db on Linux.
func resolveDBPath() string {
	dataDir := os.Getenv("XDG_DATA_HOME")
	if dataDir == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return "mqtts.db"
		}
		dataDir = filepath.Join(home, ".local", "share")
	}
	dir := filepath.Join(dataDir, "mqtts")
	os.MkdirAll(dir, 0o755)
	return filepath.Join(dir, "mqtts.db")
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

`mqtts` is a Wails v2 desktop application scaffold for a React 19 + TypeScript + Vite frontend and a Go 1.26.4 backend. It is a planned rewrite of MQTTX with Tailwind CSS and SQLite persistence.

Current implementation status:

- Phase 1 Discovery and Feature Audit is complete under `docs/`.
- Phase 2 Project Bootstrap is complete: the repository contains a Wails app scaffold, Go module, React frontend, Tailwind setup, Bun package scripts, bridge smoke test, and CI workflow.
- Phase 3 Storage Layer is complete: SQLite persistence with migrations, repository pattern, and CRUD for connections, subscriptions, messages, wills, collections, settings, and publish history.
- Phase 4 MQTT Core Engine is complete: Eclipse Paho MQTT client with connection management, publish/subscribe, MQTT 3.1/3.1.1/5.0 support, TLS, Wails event emission, and payload encoding.
- Import/export and production MQTT workflows are not implemented yet.

## Commands

### Environment

Go may need `/usr/local/go/bin` on `PATH` in this environment:

```sh
export PATH="/usr/local/go/bin:$HOME/go/bin:$PATH"
```

### Frontend commands

Run from `frontend/`:

- Install dependencies: `bun install`
- Start Vite dev server: `bun run dev`
- Build frontend: `bun run build`
- Typecheck: `bun run typecheck`
- Lint: `bun run lint`
- Test: `bun run test`
- Watch tests: `bun run test:watch`

### Backend commands

Run from the repository root:

- Download/tidy dependencies: `go mod tidy`
- Test backend: `go test ./...`
- Build backend packages: `go build ./...`
- Format Go code: `gofmt -w .`

### Wails commands

Run from the repository root after installing the Wails CLI and Linux WebKit/GTK dependencies:

- Check Wails environment: `wails doctor`
- Start desktop app in dev mode: `wails dev`
- Build desktop app: `wails build`
- Generate bindings: `wails generate module`

## Architecture

### Backend

- `main.go` — Wails entry point, embeds `frontend/dist`, configures app options, initializes database, binds backend services.
- `app.go` — `App` service, lifecycle startup hook, `Greet` bridge smoke-test method, and frontend-callable storage methods.
- `go.mod` — Go module definition with Wails v2, modernc.org/sqlite, and google/uuid dependencies.
- `wails.json` — Wails project configuration using Bun frontend commands.
- `internal/models/` — domain structs: Connection, Message, Subscription, Will, Collection, Settings, PublishHistory.
- `internal/storage/` — SQLite database, migrations, and repository CRUD operations using `database/sql`.
- `internal/storage/db.go` — database open/close, migration runner, pragmas (foreign keys, WAL).
- `internal/storage/migrations.go` — numbered migration SQL for all Phase 3 tables.
- `internal/storage/store.go` — composite Store composing all repositories.
- `internal/storage/connections.go` — ConnectionRepo with CRUD, unread count management.
- `internal/storage/subscriptions.go` — SubscriptionRepo with CRUD and MQTT 5 fields.
- `internal/storage/messages.go` — MessageRepo with CRUD and pagination.
- `internal/storage/wills.go` — WillRepo with CRUD (one-to-one with connection).
- `internal/storage/collections.go` — CollectionRepo with adjacency-list tree CRUD.
- `internal/storage/settings.go` — SettingsRepo with singleton pattern and default initialization.
- `internal/storage/publish_history.go` — PublishHistoryRepo for headers and payloads.
- `internal/mqtt/` — MQTT client engine using Eclipse Paho.
- `internal/mqtt/manager.go` — Manager: concurrent-safe map of ClientSessions, connect/disconnect/publish/subscribe.
- `internal/mqtt/client.go` — ClientSession: wraps Paho client, handles lifecycle, message handlers.
- `internal/mqtt/options.go` — maps Connection model to Paho Connect packet, TLS config, server URL.
- `internal/mqtt/events.go` — event types and Wails EventsEmit helpers for real-time frontend updates.
- `internal/mqtt/payload.go` — payload encoding/decoding (plaintext, JSON, base64, hex).

Planned backend packages from `PLAN.md` and `docs/rewrite-roadmap.md` include import/export and system integration.

### Frontend

- `frontend/src/main.tsx` — React root mount.
- `frontend/src/App.tsx` — Phase 2 app shell, navigation placeholders, Tailwind styling, and Go bridge call.
- `frontend/src/styles/index.css` — Tailwind directives and global styles.
- `frontend/wailsjs/` — Wails Go-to-TypeScript bindings; Phase 2 includes minimal stubs that Wails can regenerate.
- `frontend/package.json` — Bun-managed dependencies and scripts.

Planned frontend features are organized around connections, messages, publishing, subscriptions, settings, and import/export.

### Build and CI

- `build/` — Wails build resources, including a placeholder app icon.
- `.github/workflows/ci.yml` — CI jobs for Go, Bun frontend, and Wails build.

## Important planning references

Before implementing later phases, read:

- `PLAN.md` — target stack, proposed architecture, phases, milestones, and risks.
- `docs/feature-audit.md` — MQTTX feature inventory and include/defer/exclude decisions.
- `docs/mqttx-compatibility.md` — MQTT.js behavior, MQTT 5 behavior, and import/export compatibility checklist.
- `docs/data-model.md` — MQTTX TypeORM/SQLite model audit and planned Go/SQLite mapping guidance.
- `docs/rewrite-roadmap.md` — refined phase sequencing, dependencies, deferred features, and risk register.

Keep this file updated whenever actual commands, architecture, or tooling change.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

`mqtts` is a Wails v2 desktop application scaffold for a React 19 + TypeScript + Vite frontend and a Go 1.26.4 backend. It is a planned rewrite of MQTTX with Tailwind CSS and SQLite persistence.

Current implementation status:

- Phase 1 Discovery and Feature Audit is complete under `docs/`.
- Phase 2 Project Bootstrap is complete: the repository contains a Wails app scaffold, Go module, React frontend, Tailwind setup, Bun package scripts, bridge smoke test, and CI workflow.
- Phase 3 Storage Layer is complete: SQLite persistence with migrations, repository pattern, and CRUD for connections, subscriptions, messages, wills, collections, settings, and publish history.
- Phase 4 MQTT Core Engine is complete: Eclipse Paho MQTT client with connection management, publish/subscribe, MQTT 3.1/3.1.1/5.0 support, TLS, Wails event emission, and payload encoding.
- Phase 5 Connection Management UI is complete: sidebar connection list, tabbed create/edit form (General, Auth, Connection, TLS, MQTT 5, Will), connection status indicators, CRUD operations via Wails bindings, and useConnections/useMqttStatus hooks.
- Phase 6 Publish and Subscribe Workflow is complete: subscription panel with add/remove, publish composer with QoS/retain/format, message timeline with real-time events, message filtering (direction/topic), publish history, and backend CRUD endpoints for subscriptions/messages.
- Phase 7 Message Inspector is complete: message detail drawer with payload display modes (text/JSON/hex/base64), copy actions, QoS/retain filters, and MQTT 5 property display.
- Phase 8 Settings and Preferences is complete: settings page with theme/language/MQTT/logging/copilot configuration, persisted via Wails bindings.
- Phase 9 Import and Export is complete: JSON export of all connections and subscriptions, JSON import with ID remapping and error reporting.
- Phase 10 Security and Secret Storage is complete: OS keychain integration (macOS/Windows/Linux) via zalando/go-keyring, AES-GCM encrypted fallback, sensitive fields stripped from SQLite, no credentials in logs. Security model documented in `docs/security.md`.
- Phases 11–12 (advanced features, testing/packaging) remain.

## Commands

### Environment

Go may need `/usr/local/go/bin` on `PATH` in this environment:

```sh
export PATH="/usr/local/go/bin:$HOME/go/bin:$HOME/.bun/bin:$PATH"
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
- `internal/security/` — credential storage with OS keychain and AES-GCM encrypted fallback.
- `internal/security/store.go` — CredentialStore interface, KeychainStore (zalando/go-keyring), EncryptedStore (AES-256-GCM with machine-derived key), and NewCredentialStore factory.
- `internal/mqtt/payload.go` — payload encoding/decoding (plaintext, JSON, base64, hex).

Planned backend packages from `PLAN.md` and `docs/rewrite-roadmap.md` include import/export and system integration.

### Frontend

- `frontend/src/main.tsx` — React root mount.
- `frontend/src/App.tsx` — App shell with sidebar connection list, main content area, and form/list view switching.
- `frontend/src/App.test.tsx` — App shell tests with Wails bridge and runtime mocks.
- `frontend/src/styles/index.css` — Tailwind directives and global styles.
- `frontend/src/components/FormField.tsx` — Reusable Input, Select, Textarea, Checkbox components with Tailwind styling.
- `frontend/src/components/Tabs.tsx` — Tab bar component.
- `frontend/src/components/ConfirmDialog.tsx` — Modal confirmation dialog.
- `frontend/src/hooks/useConnections.ts` — Hook wrapping Wails CRUD bindings (create, update, remove, duplicate) with loading/error state.
- `frontend/src/hooks/useMqttStatus.ts` — Hook listening to `mqtt:connection:status` Wails events, polling IsConnected, exposing connect/disconnect.
- `frontend/src/hooks/useSubscriptions.ts` — Hook for subscription CRUD with auto-subscribe/unsubscribe on the broker.
- `frontend/src/hooks/useMessages.ts` — Hook for paginated message list with real-time `mqtt:message:received`/`mqtt:message:published` event listeners.
- `frontend/src/features/subscriptions/SubscriptionPanel.tsx` — Subscription list with add/remove form, QoS selector, topic filter input.
- `frontend/src/features/publish/PublishComposer.tsx` — Publish form with topic, payload, QoS, retain, format selector, and recent topics dropdown.
- `frontend/src/features/messages/MessageTimeline.tsx` — Message list with direction badges, QoS/retain/topic filters, message detail drawer, payload display modes (text/JSON/hex/base64), copy actions, and clear action.
- `frontend/src/features/settings/SettingsPage.tsx` — Settings page with theme, language, MQTT, logging, and AI copilot configuration.
- `frontend/src/features/import-export/ImportExportPage.tsx` — JSON export/import page with file download and upload.
- `frontend/src/hooks/useSettings.ts` — Hook for loading and saving application settings.
- `frontend/src/features/connections/ConnectionStatus.tsx` — Status dot component (green/yellow/red/gray).
- `frontend/src/features/connections/ConnectionListItem.tsx` — Connection row with status, actions, context menu, delete confirm.
- `frontend/src/features/connections/ConnectionList.tsx` — Sidebar connection list with New button.
- `frontend/src/features/connections/ConnectionForm.tsx` — Tabbed create/edit form covering all Connection model fields (General, Auth, Connection, TLS, MQTT 5, Will).
- `frontend/src/test/setup.ts` — Vitest setup with jest-dom, window.go mock, and window.runtime mock.
- `frontend/wailsjs/` — Wails Go-to-TypeScript bindings (generated by `wails build`).
- `frontend/package.json` — Bun-managed dependencies and scripts.

Planned frontend features are organized around messages, publishing, subscriptions, settings, and import/export.

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

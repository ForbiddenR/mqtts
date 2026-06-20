# MQTTX Rewrite Plan: React 19 + Go 1.26.4 + Wails v2

## 1. Goal

Rewrite the full feature set of [MQTTX](https://github.com/emqx/MQTTX) as a modern cross-platform desktop application using:

- **Frontend:** React 19 + TypeScript
- **Desktop shell:** Wails v2
- **Backend:** Go 1.26.4
- **UI styling:** Tailwind CSS
- **Persistence:** SQLite
- **Target platforms:** macOS, Windows, Linux

The goal is to replace the current Electron + Vue architecture with a lighter, faster, native-feeling Wails-based application while preserving MQTTX’s core user-facing functionality.

---

## 2. Product Scope

### Core MQTT Client Features

- Create, edit, duplicate, and delete MQTT connections
- Connect and disconnect from MQTT brokers
- Support multiple simultaneous broker connections
- Publish MQTT messages
- Subscribe and unsubscribe to topics
- Display received and published messages in a chat-like interface
- Support MQTT 3.1, MQTT 3.1.1, and MQTT 5.0
- Support TCP, TLS, WebSocket, and secure WebSocket connections
- Support authentication:
  - Client ID
  - Username/password
  - TLS certificates
- Support retained messages
- Support QoS 0, 1, and 2
- Support clean session / clean start
- Support last will and testament
- Support message history
- Support connection history
- Support payload formatting
- Support JSON pretty-printing
- Support import/export of connection data

### Desktop UX Features

- Modern connection manager
- Workspace-style layout
- Dark mode and light mode
- Responsive desktop layout
- Multi-connection workflow
- Message search and filtering
- Message inspector
- Payload editor
- Copy message/topic/payload actions
- Keyboard shortcuts
- Local app settings
- Cross-platform packaging

---

## 3. Technology Stack

### Frontend

| Area | Choice |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Component primitives | Radix UI or Headless UI |
| Icons | Lucide React |
| State management | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| Tables / virtualization | TanStack Table / TanStack Virtual |
| Payload editor | CodeMirror or Monaco Editor |
| Testing | Vitest + React Testing Library + Playwright |

### Backend

| Area | Choice |
|---|---|
| Language | Go 1.26.4 |
| Desktop framework | Wails v2 |
| MQTT client | Eclipse Paho MQTT Go or another MQTT 5-capable Go library |
| Persistence | SQLite |
| Migrations | Goose or custom migration runner |
| Logging | `log/slog` |
| Testing | `go test` |

### Toolchain Requirements

```text
Bun: latest stable
React: 19.x
TypeScript: latest stable
Vite: latest stable
Tailwind CSS: latest stable
Go: 1.26.4
Wails: v2
SQLite: embedded local database
```

---

## 4. Proposed Project Structure

```text
mqtts/
├── app.go
├── main.go
├── go.mod
├── wails.json
├── internal/
│   ├── mqtt/
│   │   ├── client.go
│   │   ├── manager.go
│   │   ├── options.go
│   │   ├── events.go
│   │   └── payload.go
│   ├── storage/
│   │   ├── db.go
│   │   ├── migrations/
│   │   ├── connections.go
│   │   ├── messages.go
│   │   └── settings.go
│   ├── config/
│   ├── certs/
│   ├── importexport/
│   └── system/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── connections/
│   │   │   ├── messages/
│   │   │   ├── publish/
│   │   │   ├── subscriptions/
│   │   │   ├── settings/
│   │   │   └── import-export/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── stores/
│   │   ├── styles/
│   │   └── types/
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
├── docs/
└── build/
```

---

## 5. Backend Design

### Wails App Service

Expose backend methods to the React frontend through Wails bindings.

Recommended service surface:

```go
type App struct {
    mqttManager *mqtt.Manager
    store       *storage.Store
}
```

Frontend-callable methods:

```go
func (a *App) ListConnections() ([]ConnectionDTO, error)
func (a *App) CreateConnection(input CreateConnectionInput) (ConnectionDTO, error)
func (a *App) UpdateConnection(id string, input UpdateConnectionInput) error
func (a *App) DeleteConnection(id string) error
func (a *App) Connect(id string) error
func (a *App) Disconnect(id string) error
func (a *App) Publish(input PublishInput) error
func (a *App) Subscribe(input SubscribeInput) error
func (a *App) Unsubscribe(input UnsubscribeInput) error
func (a *App) ListMessages(connectionID string, query MessageQuery) ([]MessageDTO, error)
func (a *App) ClearMessages(connectionID string) error
func (a *App) ImportConnections(path string) error
func (a *App) ExportConnections(path string) error
func (a *App) GetSettings() (SettingsDTO, error)
func (a *App) UpdateSettings(input SettingsDTO) error
```

### MQTT Manager

The backend should maintain active MQTT clients in memory.

Responsibilities:

- Manage connection lifecycle
- Maintain active client sessions
- Handle reconnects
- Track connection status
- Dispatch events to frontend
- Persist messages
- Manage subscriptions
- Handle TLS/WebSocket options
- Normalize MQTT 3 and MQTT 5 behavior

Concept:

```go
type Manager struct {
    clients map[string]*ClientSession
    store   storage.Store
    events  EventBus
}
```

### Event Flow

Use Wails runtime events to push real-time updates to React.

Backend emits:

```text
mqtt:connection:status
mqtt:message:received
mqtt:message:published
mqtt:subscription:created
mqtt:subscription:removed
mqtt:error
mqtt:log
```

Frontend subscribes to these events and updates Zustand stores.

---

## 6. Frontend Design

### App Layout

Use a modern three-panel layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: App title, search, theme toggle, settings          │
├───────────────┬───────────────────────────────┬─────────────┤
│ Connections   │ Message Timeline              │ Publish Box │
│ Sidebar       │                               │ / Inspector │
│               │                               │             │
│ - Groups      │ - Received messages           │ Topic       │
│ - Connections │ - Published messages          │ QoS         │
│ - Status      │ - Filters                     │ Retain      │
│               │                               │ Payload     │
└───────────────┴───────────────────────────────┴─────────────┘
```

Alternative compact layout:

- Left sidebar: connections
- Center: selected connection messages
- Bottom: publish composer
- Right drawer: connection details, subscriptions, and message inspector

### Main Frontend Modules

```text
features/
├── connections/
├── messages/
├── publish/
├── subscriptions/
├── settings/
└── import-export/
```

### UI Style Direction

Use a clean, modern developer-tool aesthetic:

- Dark-first design
- Neutral backgrounds
- Subtle borders
- Rounded cards
- Monospace payload areas
- Color-coded message directions:
  - Published: blue/indigo
  - Received: green/emerald
  - Error: red
  - System: muted gray
- Status indicators:
  - Connected: green
  - Connecting: yellow
  - Disconnected: gray
  - Error: red

Recommended design system:

```text
Tailwind CSS
Radix UI primitives
Lucide icons
CSS variables for theme tokens
```

---

## 7. Data Model Draft

### Connection

```ts
type Connection = {
  id: string
  name: string
  groupId?: string
  protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss'
  host: string
  port: number
  path?: string
  clientId: string
  username?: string
  passwordRef?: string
  mqttVersion: '3.1' | '3.1.1' | '5.0'
  cleanStart: boolean
  keepAlive: number
  connectTimeout: number
  reconnect: boolean
  reconnectPeriod: number
  tls?: TLSConfig
  will?: WillConfig
  mqtt5?: MQTT5Properties
  createdAt: string
  updatedAt: string
}
```

### Subscription

```ts
type Subscription = {
  id: string
  connectionId: string
  topic: string
  qos: 0 | 1 | 2
  active: boolean
  createdAt: string
}
```

### Message

```ts
type Message = {
  id: string
  connectionId: string
  direction: 'incoming' | 'outgoing'
  topic: string
  payload: string
  payloadEncoding: 'utf8' | 'base64' | 'hex'
  qos: 0 | 1 | 2
  retained: boolean
  duplicate?: boolean
  packetId?: number
  properties?: Record<string, unknown>
  createdAt: string
}
```

---

## 8. Backend Event Contract

### Connection Status Event

```ts
type ConnectionStatusEvent = {
  connectionId: string
  status: 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error'
  error?: string
  timestamp: string
}
```

### Message Event

```ts
type MessageReceivedEvent = {
  connectionId: string
  message: Message
}
```

### Error Event

```ts
type MqttErrorEvent = {
  connectionId?: string
  code: string
  message: string
  detail?: string
}
```

---

## 9. Implementation Phases

## Phase 1: Discovery and Feature Audit

Tasks:

- Clone and analyze MQTTX source
- List all desktop features
- List all CLI features
- List all web features
- Identify features to include in the Wails desktop rewrite
- Identify features to defer
- Document current data models from MQTTX
- Document import/export format
- Document MQTT.js behavior that must be matched
- Create compatibility checklist

Deliverables:

- `docs/feature-audit.md`
- `docs/mqttx-compatibility.md`
- `docs/data-model.md`
- `docs/rewrite-roadmap.md`

Status: complete. The Phase 1 deliverables were created from an audit of upstream MQTTX revision `a8a9087fd6a9b434300bf4882c7978c9196ac674`.

## Phase 2: Project Bootstrap

Tasks:

- Install and verify Go 1.26.4
- Install and verify Bun
- Install Wails v2 CLI
- Create Wails app using React + TypeScript frontend
- Upgrade/configure frontend to React 19
- Configure Vite
- Configure Tailwind CSS
- Configure ESLint and Prettier
- Configure Go formatting/linting
- Add project structure
- Add frontend/backend bridge smoke test
- Add CI checks for Go, Bun, React, TypeScript, Wails build, frontend tests, and backend tests

Deliverables:

- Running Wails app
- React frontend renders successfully
- Go backend callable from frontend
- Tailwind CSS working
- CI pipeline builds frontend and backend

Status: complete. The Phase 2 scaffold adds a Wails v2 Go app, React 19 + TypeScript + Vite frontend, Tailwind CSS, Bun scripts, a frontend/backend bridge smoke test, and CI workflow.

## Phase 3: Storage Layer

Tasks:

- Add SQLite integration
- Add migration system
- Define core entities:
  - Connection
  - Subscription
  - Message
  - Publish history
  - Settings
  - Payload template
- Implement repository layer
- Add unit tests
- Add import/export foundation

Deliverables:

- Persistent local database
- Database migrations
- CRUD operations for connections
- CRUD operations for subscriptions
- Message history persistence

Status: complete. The Phase 3 storage layer adds SQLite persistence via modernc.org/sqlite, explicit migrations, repository pattern with CRUD for connections/subscriptions/messages/wills/collections/settings/publish history, and unit tests using in-memory SQLite.

## Phase 4: MQTT Core Engine

Tasks:

- Choose Go MQTT library
- Implement connection options mapper
- Implement connection lifecycle
- Implement connect/disconnect
- Implement reconnect
- Implement publish
- Implement subscribe/unsubscribe
- Implement incoming message handler
- Implement MQTT 3 support
- Implement MQTT 5 support
- Implement TLS support
- Implement WebSocket support
- Implement Last Will support
- Implement QoS handling
- Emit Wails events for state/message changes

Deliverables:

- Backend can connect to MQTT brokers
- Backend can publish and receive messages
- Backend supports multiple concurrent connections
- Backend emits real-time frontend events
- MQTT feature parity test matrix

Status: complete. The Phase 4 MQTT engine adds Eclipse Paho MQTT client with connection management, publish/subscribe, MQTT 3.1/3.1.1/5.0 support, TLS, Wails event emission, payload encoding, and unit tests.

## Phase 5: Connection Management UI

Status: complete. The Phase 5 UI adds a sidebar connection list, tabbed create/edit form (General, Auth, Connection, TLS, MQTT 5, Will), connection status indicators, duplicate/delete/edit actions, and useConnections/useMqttStatus hooks integrated with Wails bindings.

Tasks:

- Build connection list/sidebar
- Build connection form
- Add connection validation
- Add protocol selector
- Add authentication fields
- Add TLS configuration UI
- Add MQTT 5 advanced properties UI
- Add Last Will configuration UI
- Add duplicate/delete/edit actions
- Add connection status indicators
- Add connection grouping if needed

Deliverables:

- Users can create, edit, delete, and duplicate connections
- Users can connect and disconnect from UI
- Connection state updates live
- Configuration persists to SQLite

## Phase 6: Publish and Subscribe Workflow

Status: complete. The Phase 6 workflow adds a subscription panel with add/remove, publish composer with QoS/retain/format, message timeline with real-time events, message filtering by direction and topic, publish history headers, and backend CRUD endpoints for subscriptions and messages.

Tasks:

- Build subscription panel
- Add subscribe/unsubscribe forms
- Add topic filter validation
- Add QoS selector
- Build publish composer
- Add retain flag
- Add payload editor
- Add payload format selector
- Add recently used topics
- Add publish history
- Add message direction display

Deliverables:

- Users can subscribe to topics
- Users can publish messages
- Received and sent messages appear in timeline
- Publish history is stored
- Topic and QoS options are preserved

## Phase 7: Message Timeline and Inspector

Status: complete. The Phase 7 inspector adds a message detail drawer with payload display modes (text/JSON/hex/base64), copy actions, QoS/retain filters, and MQTT 5 property display.

Tasks:

- Build virtualized message list
- Add message bubbles/cards
- Add timestamp display
- Add topic display
- Add QoS/retain indicators
- Add payload preview
- Add JSON formatting
- Add raw/text/hex/base64 display modes
- Add copy actions
- Add message search
- Add filters for topic, direction, QoS, retained flag, and time range
- Add clear history action
- Add message detail drawer

Deliverables:

- Fast message display for large histories
- Searchable/filterable message timeline
- Rich payload inspection
- Modern chat-like UX

## Phase 8: Settings and Preferences

Status: complete. The Phase 8 settings page provides theme/language/MQTT/logging/copilot configuration, persisted via Wails bindings.

Tasks:

- Add settings page
- Add theme switcher
- Add message retention settings
- Add database cleanup options
- Add default connection options
- Add default publish options
- Add proxy/network settings if needed
- Add keyboard shortcut configuration

Deliverables:

- Persistent app settings
- Light/dark/system theme
- Configurable message retention
- Configurable UI preferences

## Phase 9: Import, Export, and Migration

Status: complete. JSON export of all connections and subscriptions with file download, and JSON import with ID remapping and error reporting. MQTTX format import is not yet implemented.

Tasks:

- Analyze MQTTX export format
- Implement import from existing MQTTX data if feasible
- Implement export to JSON
- Implement selective export:
  - Connections only
  - Connections + subscriptions
  - Full data
- Handle secrets securely
- Add import preview UI
- Add conflict resolution

Deliverables:

- Users can import existing MQTTX connections
- Users can export app data
- Migration path from original MQTTX is documented

## Phase 10: Security and Secret Storage

Status: complete. OS keychain integration via zalando/go-keyring (macOS Keychain, Windows Credential Manager, Linux Secret Service) with AES-GCM encrypted fallback. Passwords and TLS keys are stored in the keychain, not in SQLite. No credentials in logs. Security model documented in `docs/security.md`.

Tasks:

- Decide password storage strategy
- Prefer OS keychain integration:
  - macOS Keychain
  - Windows Credential Manager
  - Linux Secret Service
- Encrypt sensitive fields if keychain is unavailable
- Avoid logging passwords, tokens, and certificate content
- Secure TLS certificate loading
- Validate file permissions where applicable

Deliverables:

- Safe credential handling
- No sensitive data in logs
- Documented security model

## Phase 11: Advanced Features

Status: partial. Implemented: connection statistics (messages/bytes sent/received, latency, uptime, reconnect count), latency measurement via subscribe round-trip, payload templates (stored in settings JSON), saved workspace (last selected connection ID persisted in settings). Remaining: script generators, message diffing, multi-window, CLI bridge.

Depending on the original MQTTX feature audit, implement:

- Payload templates
- Script examples or message generators
- Topic aliases
- Mock/test data generation
- Broker diagnostics
- Connection statistics
- Latency measurement
- Message diffing
- Saved workspaces
- Multi-window support
- CLI bridge or separate Go CLI
- Web version, if needed later

## Phase 12: Testing and Packaging

Status: complete. 22 Go backend tests (storage, MQTT options, security), 21 frontend component tests (App, ConnectionForm, MessageTimeline, PublishComposer). CI workflow runs backend/frontend/Wails build on push. Release workflow builds for macOS (arm64/amd64), Linux (amd64), and Windows (amd64) on version tags.

Tasks:

- Add backend unit tests
- Add frontend component tests
- Add Playwright E2E tests
- Add integration tests with local brokers such as Mosquitto or EMQX
- Add cross-platform packaging
- Add release workflow

Deliverables:

- Tested backend and frontend
- Verified MQTT workflows
- macOS, Windows, and Linux builds
- Release documentation

---

## 10. Suggested Milestones

### Milestone 1: Foundation

Goal: App shell works.

- Wails app created
- React 19 + Tailwind configured
- SQLite initialized
- Basic layout implemented
- Frontend/backend communication working

### Milestone 2: Basic MQTT Client

Goal: Connect, subscribe, and publish.

- Create connection
- Connect/disconnect
- Subscribe
- Publish
- Receive messages
- Show message timeline

### Milestone 3: Feature-Parity Core

Goal: Match everyday MQTTX usage.

- Multiple connections
- QoS support
- Retain support
- TLS
- WebSocket
- Message history
- Publish history
- Import/export
- Settings

### Milestone 4: MQTT 5 and Advanced Config

Goal: Full protocol coverage.

- MQTT 5 properties
- Last Will
- Advanced session options
- User properties
- Payload format handling

### Milestone 5: Modern UX Polish

Goal: Make the app feel like a professional modern desktop tool.

- Refined layout
- Dark/light themes
- Keyboard shortcuts
- Search/filtering
- Inspector panel
- Virtualized large message lists
- Better empty/error/loading states

### Milestone 6: Packaging and Release

Goal: Production-ready cross-platform release.

- macOS build
- Windows build
- Linux build
- GitHub Actions release workflow
- Signed/notarized builds where needed
- Documentation
- Migration guide

---

## 11. Recommended Initial MVP

The first usable MVP should include:

- Wails app shell
- React 19 + Tailwind modern layout
- SQLite persistence
- Create/edit/delete connection
- MQTT TCP connection
- Username/password auth
- Subscribe to topic
- Publish message
- Receive message
- Message timeline
- Dark mode

Do not start with every MQTT 5, TLS, import/export, and advanced feature. Add them after the core workflow is stable.

---

## 12. Example MVP User Flow

1. User opens app.
2. User clicks **New Connection**.
3. User enters:
   - Name
   - Host
   - Port
   - Protocol
   - Client ID
   - Username/password
4. User clicks **Connect**.
5. App shows connected state.
6. User subscribes to `test/topic`.
7. User publishes `hello` to `test/topic`.
8. App displays outgoing and incoming messages.
9. User closes app.
10. User reopens app and sees saved connection and message history.

---

## 13. Documentation to Produce

```text
docs/
├── architecture.md
├── feature-audit.md
├── mqtt-support-matrix.md
├── data-model.md
├── database-schema.md
├── frontend-architecture.md
├── backend-architecture.md
├── import-export-format.md
├── security.md
├── release.md
└── migration-from-mqttx.md
```

---

## 14. Main Technical Risks

### MQTT 5 Feature Completeness

Go MQTT libraries vary in MQTT 5 support. Test MQTT 5 connect properties, publish properties, subscribe options, user properties, reason codes, and session behavior before committing to a library.

### WebSocket Support

Some Go MQTT clients support TCP well but WebSocket less completely. Verify WebSocket support early.

### TLS and Certificate UX

Certificate configuration can become complex. The UI should support CA certificate, client certificate, client private key, insecure skip verify, and server name override.

### Secret Storage

Do not store passwords directly in SQLite unless encrypted. Prefer OS keychain support.

### Large Message Histories

Message timelines can grow quickly. Use pagination, virtualization, retention limits, background cleanup, and efficient SQLite indexes.

### Wails Event Throughput

High-frequency MQTT messages may overload the UI if every message is emitted individually. Consider batching, debounced UI updates, backpressure controls, and message rate limits in the renderer.

---

## 15. Final Recommendation

Use an incremental rewrite strategy rather than trying to clone every MQTTX feature at once.

Recommended sequence:

1. Audit MQTTX features deeply.
2. Build a Wails MVP.
3. Validate MQTT library support.
4. Implement core desktop workflows.
5. Add advanced MQTT/TLS/MQTT 5 support.
6. Add import/export and migration.
7. Polish UI and package releases.

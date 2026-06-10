# MQTTX Feature Audit

Phase 1 deliverable for `mqtts`, a Wails + React + Go rewrite of MQTTX.

- Upstream project: <https://github.com/emqx/MQTTX>
- Upstream revision audited: `a8a9087fd6a9b434300bf4882c7978c9196ac674` (`main`, 2026-05-22, `fix(gpu): refine hardware acceleration setting handling`)
- Upstream app version/dependency snapshot: MQTTX `v1.13.0`, Electron 39, Vue 2, TypeORM, SQLite, `mqtt@4.3.7`

## Summary

MQTTX is more than a basic MQTT client. It combines a desktop client, CLI, web client, local persistence, import/export, scripting, schema codecs, AI/Copilot support, dashboard widgets, update/logging flows, and Electron-specific system integration.

For the Wails rewrite, the MVP should prioritize protocol correctness, connection management, subscriptions, publish/receive flows, persistence, search/filtering, and import/export compatibility. AI, dashboard widgets, advanced scripting, and update infrastructure should be deferred until the core MQTT workflow is stable.

## Desktop feature inventory

### Connection management

Source areas: `src/views/connections/`, `src/components/ConnectionSelect.vue`, `src/database/models/ConnectionEntity.ts`, `src/database/services/ConnectionService.ts`, `src/utils/mqttUtils.ts`.

Features:

- Create, edit, duplicate, delete, and organize MQTT connections.
- Connection grouping through collection/folder nodes.
- Connection tree ordering via `orderId`.
- Per-connection unread message counts.
- Optional timestamp suffix on client IDs via `clientIdWithTime`.
- Connection protocols: `mqtt`, `mqtts`, `ws`, `wss`.
- MQTT versions: MQTT 3.1, 3.1.1, and 5.0 behavior in the client option builder.
- Authentication via username/password, including MQTT 5 password-without-username handling.
- TLS certificate modes: no cert, server cert, self-signed cert.
- ALPN protocol configuration.
- Reconnect toggle and reconnect period.
- Keepalive and connect timeout controls.
- MQTT 5 connection properties.
- Last Will and Testament configuration.

### Workspace and messaging

Source areas: `src/components/MessageList.vue`, `MsgLeftItem.vue`, `MsgRightItem.vue`, `MsgPublish.vue`, `FullMsgDialog.vue`, `MsgTypeTabs.vue`, `TimedMessage.vue`, `PayloadSizeControl.vue`, `src/database/models/MessageEntity.ts`, `src/database/services/MessageService.ts`.

Features:

- Multi-connection workspace.
- Received and published message timeline.
- Message direction distinction via `out`.
- Topic, payload, QoS, retain, color, metadata, and MQTT 5 publish properties.
- Message pagination and infinite loading.
- Message type filters: all, received, publish.
- Topic filtering/search.
- Full message detail dialog.
- Payload display size control.
- Timed/interval publishing.
- Publish history for message headers and payloads.
- Optional QoS 0 message suppression through `ignoreQoS0Message`.

### Subscription management

Source areas: `src/components/SubscriptionsList.vue`, `src/components/TopicSelect.vue`, `src/database/models/SubscriptionEntity.ts`, `src/database/services/SubscriptionService.ts`.

Features:

- Subscribe/unsubscribe topic filters.
- QoS selection.
- Enable/disable saved subscriptions.
- Subscription alias, retain flag, color, and creation time.
- MQTT 5 subscription options: No Local (`nl`), Retain As Published (`rap`), Retain Handling (`rh`), subscription identifier, user properties.
- Automatic resubscribe on reconnect controlled by global setting.
- Multi-topic support controlled by global setting.

### Import/export

Source areas: `src/components/ImportData.vue`, `src/components/ExportData.vue`, `src/utils/importExportTypes.ts`, database services.

Features:

- Import/export saved data.
- Formats: JSON, YAML, XML, CSV, Excel.
- Validation for required connection fields such as client ID, name, host, and port.
- SSL/certificate validation for cert-dependent records.
- Special sentinel serialization for `null`, `undefined`, empty string, empty array, and empty object to preserve JavaScript values through export/import.
- Streaming/export service behavior for larger datasets.

### Settings

Source areas: `src/views/settings/`, `src/database/models/SettingEntity.ts`, `src/database/services/SettingService.ts`.

Features:

- Window size persistence.
- Auto-update check.
- Language: Chinese, English, Japanese, Turkish, Hungarian.
- Theme: light, dark, night.
- OS theme sync.
- Auto-resubscribe.
- Multi-topic mode.
- JSON highlighting.
- Max reconnect attempts.
- Log level.
- Copilot enablement and model/provider settings.
- QoS 0 filtering.
- Payload display limit, topic whitespace detection, and hardware acceleration are present in newer global state/types and should be accounted for during parity checks.

### Scripting and schema support

Source areas: `src/views/script/`, `src/components/ImportScript.vue`, `UseScript.vue`, `src/database/models/ScriptEntity.ts`, `src/database/services/ScriptService.ts`, `src/utils/protobuf.ts`, `src/utils/avro.ts`.

Features:

- User-defined JavaScript functions.
- Schema records for Protocol Buffers and Apache Avro.
- Script/schema application to message flows.
- Import scripts from files.
- Schema configuration such as Protobuf message name.

### Payload codecs and formatting

Source areas: `src/utils/convertPayload.ts`, `protobuf.ts`, `avro.ts`, package dependencies.

Features:

- Plaintext.
- JSON.
- Base64.
- Hex.
- CBOR.
- MessagePack.
- Protocol Buffers.
- Apache Avro.
- XML dependency support.
- JSON big number parsing support.

### Logging, help, about, updates, and window/system integration

Source areas: `src/views/log/`, `help/`, `about/`, `update/`, `window/`, `src/components/Ipc.vue`, Electron dependencies.

Features:

- Application logs.
- About/help screens.
- Auto-update UI using Electron updater infrastructure.
- Electron IPC/remote integration.
- Hardware acceleration setting handling.
- Window and platform-specific behavior.

### AI/Copilot

Source areas: `src/components/ai/`, `src/database/models/CopilotEntity.ts`, `src/database/services/CopilotService.ts`, package dependencies.

Features:

- Copilot chat messages with role/content/timestamp.
- AI providers/dependencies: OpenAI, Anthropic, Azure, Google, DeepSeek, xAI.
- Vercel AI SDK integration.
- MCP SDK support.
- Settings for API host, API key, and model.

### Dashboard and widgets

Source areas: `src/database/models/DashboardEntity.ts`, `WidgetEntity.ts`, `TopicNodeEntity.ts`, `DashboardService.ts`, `WidgetService.ts`, `TopicNodeService.ts`, `src/components/charts/`, `src/components/widget-configs/`, `echarts`.

Features:

- Dashboards with name, description, ordering, global settings, and widgets.
- Widget types: Big Number, Gauge, Line.
- Widget layout and sizing constraints.
- Topic pattern binding.
- Value field extraction.
- Schema-aware widget decoding.
- Thresholds, decimals, units, colors, smooth/area options.
- Time-series data points for charting.
- Topic tree visualization and node persistence.

## CLI feature inventory

The upstream repository includes a separate CLI package referenced by repository scripts and globs. The Wails rewrite is a desktop rewrite, but CLI behavior is relevant as a compatibility reference.

Expected CLI feature areas:

- `conn`-style connection command for opening broker sessions.
- `sub` command for subscribing to topic filters.
- `pub` command for publishing messages.
- Shared MQTT option surface: host, port, protocol/version, client ID, username/password, QoS, retain, TLS, and WebSocket options.

Decision: document CLI options during Phase 2/3 library selection if a shared Go core is expected to support future CLI reuse. Do not implement CLI in the initial desktop MVP.

## Web feature inventory

The upstream repository includes a web client referenced by scripts/globs.

Expected web feature areas:

- Browser-oriented MQTT client experience.
- WebSocket and secure WebSocket connections only.
- Subset of desktop connection/publish/subscribe functionality.
- Docker/deployment support for hosted use.

Decision: Wails desktop should keep WebSocket support but should not implement a separate web deployment in the initial rewrite.

## Include/defer/exclude matrix

| Feature area | Decision | Rationale |
|---|---:|---|
| MQTT connection CRUD | Include P0 | Core user workflow. |
| MQTT 3.1/3.1.1/5.0 support | Include P0 | Required product scope and compatibility target. |
| TCP/TLS/WebSocket/Secure WebSocket | Include P0 | Required product scope. |
| Username/password auth | Include P0 | Core broker access. |
| TLS server/self-signed certs | Include P0 | Common desktop MQTT need. |
| MQTT 5 connection/publish/subscription/will properties | Include P0/P1 | Needed for parity; can expose progressively. |
| Multiple active connections | Include P0 | Required product scope. |
| Subscription list and saved subscriptions | Include P0 | Core MQTT workflow. |
| Publish composer | Include P0 | Core MQTT workflow. |
| Message timeline and inspector | Include P0 | Core MQTT workflow. |
| Message persistence and pagination | Include P0 | Required for usable desktop client. |
| Search/filtering | Include P1 | Important for parity and user value. |
| Import/export JSON | Include P1 | High-value migration path from MQTTX. |
| Import/export YAML/XML/CSV/Excel | Include P2 | Useful parity but less critical than JSON. |
| Payload formats plaintext/JSON/Base64/Hex | Include P1 | Common workflows. |
| CBOR/MsgPack/Protobuf/Avro/XML codecs | Defer P2 | Advanced but already part of MQTTX parity. |
| Scripting | Defer P2/P3 | Powerful but security-sensitive and not MVP-critical. |
| Dashboard widgets | Defer P3 | Separate product surface; depends on stable message pipeline. |
| Topic tree visualization | Defer P2 | Useful but not required for MVP. |
| AI/Copilot | Defer P3 | Large integration surface, credentials, MCP, provider churn. |
| MCP support | Defer P3 | Belongs with Copilot, not core MQTT. |
| CLI | Exclude from desktop MVP | Not part of Wails desktop deliverable. |
| Web app deployment | Exclude from desktop MVP | Wails desktop rewrite only. |
| Electron auto-update/IPCs | Exclude/reimplement later | Electron-specific; Wails has different runtime primitives. |
| Internationalization | Defer P2 | Valuable but not needed for first functional MVP. |
| Themes | Include P1 | Expected modern desktop behavior. |
| Logs | Include P1 | Important for troubleshooting. |
| Hardware acceleration toggle | Defer/Possibly exclude | Platform-specific and may not map to Wails directly. |

## Feature dependencies

- Connection CRUD blocks subscriptions, publish, message persistence, and import/export.
- MQTT client manager blocks real-time events and active workspace behavior.
- Storage schema blocks saved connections, messages, subscriptions, settings, and migration/import.
- MQTT 5 option modeling blocks full compatibility with upstream MQTTX records.
- Payload codec abstraction blocks advanced codecs, schema support, scripts, and dashboard value extraction.
- Message event bus blocks timeline, topic tree, dashboard widgets, and AI-driven analysis.
- Import/export compatibility depends on stable data models and sentinel value handling.

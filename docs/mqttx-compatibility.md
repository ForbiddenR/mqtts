# MQTTX Compatibility Checklist

Phase 1 deliverable for `mqtts`, a Wails + React + Go rewrite of MQTTX.

- Upstream project: <https://github.com/emqx/MQTTX>
- Upstream revision audited: `a8a9087fd6a9b434300bf4882c7978c9196ac674`
- Compatibility-sensitive upstream files: `src/utils/mqttUtils.ts`, `src/utils/importExportTypes.ts`, `src/utils/convertPayload.ts`, `src/utils/topicMatch.ts`, `src/database/models/*`, `src/components/ImportData.vue`, `src/components/ExportData.vue`

## Compatibility goal

The rewrite should preserve MQTTX behavior where it affects saved data, broker interoperability, user expectations, and import/export. Electron-specific implementation details do not need to be preserved, but user-visible behavior should either be matched or documented as a deliberate deviation.

## MQTT protocol behavior

| Behavior | MQTTX behavior | Rewrite requirement |
|---|---|---|
| MQTT versions | Maps `3.1` to protocol version 3, `3.1.1` to 4, `5.0` to 5. | Support all three versions. |
| MQTT 3.1 protocol ID | Sets `protocolId` to `MQIsdp`. | Ensure selected Go MQTT library can set equivalent protocol ID. |
| Protocols | Supports `mqtt`, `mqtts`, `ws`, `wss`. | Support TCP, TLS, WebSocket, and secure WebSocket. |
| Legacy protocol detection | Missing protocol falls back to `mqtts` when SSL is true, otherwise `mqtt`. | Preserve during import/migration. |
| WebSocket URL path | Ensures WS/WSS path starts with `/`; default path is `/mqtt`. | Preserve path normalization. |
| Default reconnect period | `4000` ms. | Match unless the user changes it. |
| Reconnect disabled | Sets `reconnectPeriod = 0`. | Use equivalent no-auto-reconnect behavior. |
| Auto-resubscribe | Uses global `autoResub`; valid only on reconnect. | Preserve as a setting. |
| QoS 0 filtering | `ignoreQoS0Message` drops QoS 0 messages when enabled. | Preserve as a user setting. |

## MQTT 5 compatibility

### Connection properties

MQTTX stores and forwards these connection properties when using MQTT 5:

- `sessionExpiryInterval`
- `receiveMaximum`
- `maximumPacketSize`
- `topicAliasMaximum`
- `requestResponseInformation`
- `requestProblemInformation`
- `userProperties`
- `authenticationMethod`
- `authenticationData`

Rewrite checklist:

- [ ] Strip `null` and `undefined` values before sending properties to the MQTT client.
- [ ] Preserve `userProperties` as structured key-value data even if stored as JSON in SQLite.
- [ ] Support MQTT 5 enhanced authentication fields.
- [ ] Account for MQTTX workaround where `properties.topicAliasMaximum` is also assigned to `topicAliasMaximum` for MQTT.js.

### Clean/session behavior

When `sessionExpiryInterval` is absent and `clean` is false, MQTTX sets session expiry interval to `0xFFFFFFFF`. The source comments describe this as a user-friendly non-standard behavior: Clean Start false plus Session Expiry Interval max means the server must not delete session state.

Rewrite requirement:

- [ ] Match this behavior for imported MQTTX connections unless a Go library makes it impossible.
- [ ] Document the behavior in UI help text because it can surprise users expecting strict defaults.

### Publish properties

MQTTX supports these publish/message properties:

- `payloadFormatIndicator`
- `messageExpiryInterval`
- `topicAlias`
- `responseTopic`
- `correlationData`
- `userProperties`
- `subscriptionIdentifier`
- `contentType`

Stored connection defaults use `pushProps*` columns, while saved messages use direct property names.

Rewrite requirement:

- [ ] Model reusable publish defaults on the connection.
- [ ] Model actual message properties on each message.
- [ ] Avoid losing arbitrary user properties during import/export.

### Subscription properties

MQTTX supports:

- QoS `0 | 1 | 2`
- No Local (`nl`)
- Retain As Published (`rap`)
- Retain Handling (`rh`: `0 | 1 | 2`)
- `subscriptionIdentifier`
- `userProperties`

Rewrite requirement:

- [ ] Preserve these fields in storage.
- [ ] Send them only when MQTT version is 5.
- [ ] Gracefully hide or disable them for MQTT 3.x connections.

### Will properties

MQTTX supports:

- `willDelayInterval`
- `payloadFormatIndicator`
- `messageExpiryInterval`
- `contentType`
- `responseTopic`
- `correlationData`
- `userProperties`

Rewrite requirement:

- [ ] Preserve one will configuration per connection.
- [ ] Strip null/undefined will properties before connecting.
- [ ] Delete will configuration when its connection is deleted.

## Authentication behavior

| Case | MQTTX behavior | Rewrite requirement |
|---|---|---|
| MQTT 5 password without username | Allowed. | Match. |
| MQTT 3.x password without username | Rejected or coerced by inserting empty username; source notes MQTT 3.1.1 requires username when password is set. | Match user-visible validation. |
| SCRAM enhanced auth | If MQTT 5 and `authenticationMethod`, `username`, and `password` are present, initializes SCRAM auth and attaches auth handler. | Evaluate Go library support; if not available in MVP, mark as unsupported on import. |

## TLS and certificate behavior

MQTTX fields:

- `ssl`
- `certType`: empty, `server`, `self`
- `ca`
- `cert`
- `key`
- `rejectUnauthorized`
- `ALPNProtocols`

Compatibility requirements:

- [ ] Support server-authenticated TLS and mutual/self-signed certificate flows.
- [ ] Preserve `rejectUnauthorized`, defaulting to true when absent.
- [ ] Parse ALPN protocols from comma-separated UI input, stripping brackets and spaces.
- [ ] Store certificate paths or certificate metadata in a Wails-safe way.
- [ ] Validate that SSL records with certificate type requirements include the needed CA/cert/key values on import.

## Import/export compatibility

Supported upstream formats:

- JSON
- YAML
- XML
- CSV
- Excel

Compatibility requirements:

- [ ] JSON import/export should be first-class and available before other formats.
- [ ] Preserve nested connection data: connection, subscriptions, messages, will, MQTT 5 properties, publish defaults.
- [ ] Validate required fields: client ID, connection name, host, and port.
- [ ] Validate certificate data for SSL/cert-type combinations.
- [ ] Keep round-tripping stable for JavaScript special values used by upstream exports.

### Special sentinel values

`src/utils/importExportTypes.ts` uses sentinels to preserve values that JSON serialization can lose or coerce:

| Sentinel | Value represented |
|---|---|
| `TYPE_NULL` | `null` |
| `TYPE_UNDEFINED` | `undefined` |
| `EMPTY_STRING` | `""` |
| `EMPTY_ARRAY` | `[]` |
| `EMPTY_OBJECT` | `{}` |

Rewrite requirement:

- [ ] Recognize these sentinel strings during MQTTX import.
- [ ] Export them only when targeting MQTTX-compatible export format.
- [ ] Do not use `undefined` internally in Go; map to nullable/optional fields.

## Payload and formatting compatibility

MQTTX-supported payload types include:

- Plaintext
- JSON
- Base64
- Hex
- CBOR
- MessagePack
- Protobuf
- Avro
- XML-related conversion support

Rewrite requirement:

- [ ] MVP should include plaintext, JSON, Base64, and Hex.
- [ ] Advanced codecs should share a common payload codec interface for later CBOR/MsgPack/Protobuf/Avro/XML support.
- [ ] Preserve payload type in publish history.
- [ ] Preserve raw payload where decoding fails; decoding errors should not destroy message data.

## Topic matching compatibility

MQTTX has topic wildcard matching behavior in `src/utils/topicMatch.ts`.

Rewrite requirement:

- [ ] Support MQTT wildcard rules for `#` and `+`.
- [ ] Use broker-compatible semantics for matching, even if MQTTX has quirks.
- [ ] Document deliberate deviations if the rewrite fixes an MQTTX matching bug.

## Message persistence and pagination

MQTTX behavior:

- Stores messages per connection.
- Stores direction via `out` boolean.
- Stores `topic`, `payload`, `qos`, `retain`, `color`, metadata, creation time, and MQTT 5 properties.
- Provides pagination with total, published total, received total, page, and limit.
- Filters by message type and topic.

Rewrite requirement:

- [ ] Use stable pagination for large message histories.
- [ ] Preserve imported `out` values but expose clearer `direction` in Go/React types if desired.
- [ ] Maintain per-connection message history.
- [ ] Index connection/time/topic fields in SQLite during the storage phase.

## Settings compatibility

MQTTX settings include:

- Window width/height.
- Auto-update check.
- Language.
- Theme.
- Max reconnect times.
- Auto-resubscribe.
- OS theme sync.
- Multi-topic mode.
- JSON highlight.
- Copilot enablement/API host/API key/model.
- Log level.
- Ignore QoS 0 messages.

Rewrite requirement:

- [ ] Preserve core settings: theme, language, reconnect, auto-resubscribe, multi-topic, JSON highlight, log level, QoS 0 filter.
- [ ] Defer Copilot settings unless AI/Copilot is implemented.
- [ ] Exclude Electron-only update/window behavior unless mapped to Wails equivalents.

## Deliberate deviations for the Wails rewrite

| MQTTX behavior | Rewrite decision |
|---|---|
| Electron IPC and `@electron/remote` | Replace with Wails runtime and Go bindings. |
| Vue 2 + Vuex + Element UI | Replace with React 19, TypeScript, and Tailwind CSS. |
| TypeORM entities | Replace with explicit Go storage models and SQLite migrations. |
| MQTT.js | Replace with a Go MQTT client selected in Phase 2/3; compatibility behavior must be tested. |
| Auto-update implementation | Reassess later using Wails-compatible update strategy. |
| AI/Copilot and MCP | Defer until core desktop MQTT workflow is complete. |
| Dashboard widgets | Defer until message pipeline and topic matching are mature. |
| JavaScript `undefined` persistence | Import sentinels, but use nullable/optional Go fields internally. |

## Acceptance checklist for future implementation

- [ ] Existing MQTTX JSON export imports without data loss for core fields.
- [ ] MQTT 3.1, 3.1.1, and 5.0 connections succeed against test brokers.
- [ ] TLS server/self-signed configurations work.
- [ ] WebSocket paths are normalized like MQTTX.
- [ ] Reconnect disabled means no automatic reconnect.
- [ ] `clean=false` MQTT 5 sessions apply MQTTX session expiry behavior.
- [ ] Subscriptions restore on reconnect when auto-resubscribe is enabled.
- [ ] Publish/received messages preserve MQTT 5 properties.
- [ ] Sentinel values in imports are decoded correctly.
- [ ] Any unsupported MQTTX feature is reported clearly during import.

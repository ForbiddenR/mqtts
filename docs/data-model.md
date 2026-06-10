# MQTTX Data Model Audit

Phase 1 deliverable for `mqtts`, a Wails + React + Go rewrite of MQTTX.

- Upstream project: <https://github.com/emqx/MQTTX>
- Upstream revision audited: `a8a9087fd6a9b434300bf4882c7978c9196ac674`
- Upstream persistence stack: TypeORM `0.2.x` + SQLite `sqlite3@5.1.6`

## Overview

MQTTX stores application state in SQLite through TypeORM entities. The rewrite should not copy TypeORM structure directly, but it should preserve the importable data shape and compatibility-sensitive fields.

Recommended rewrite approach:

- Use explicit SQLite migrations rather than ORM-generated schema.
- Use snake_case column names in Go/SQLite while supporting MQTTX camelCase names in import/export DTOs.
- Keep MQTT 5 property groups as JSON columns where that reduces schema churn, while indexing frequently queried fields separately.
- Keep import/export DTOs separate from internal storage structs.

## Current MQTTX entities

### `ConnectionEntity`

Purpose: saved MQTT connection configuration and connection-tree node.

Primary key: UUID `id`.

Core fields:

- `clientId` mapped to `client_id`
- `name`
- `clean`
- `protocol`: `ws`, `wss`, `mqtt`, `mqtts`
- `host`
- `port`
- `keepalive`
- `connectTimeout`
- `reconnect`
- `reconnectPeriod`
- `username`
- `password`
- `path`
- `ssl`
- `mqttVersion`
- `unreadMessageCount`
- `clientIdWithTime`
- `orderId`
- `isCollection` fixed false for connection records
- `createAt`
- `updateAt`

TLS/certificate fields:

- `certType`: empty, `server`, `self`
- `rejectUnauthorized`
- `ALPNProtocols`
- `ca`
- `cert`
- `key`

MQTT 5 connection properties:

- `sessionExpiryInterval`
- `receiveMaximum`
- `maximumPacketSize`
- `topicAliasMaximum`
- `requestResponseInformation`
- `requestProblemInformation`
- `userProperties`
- `authenticationMethod`
- `authenticationData`

MQTT 5 default publish properties:

- `pushPropsPayloadFormatIndicator`
- `pushPropsMessageExpiryInterval`
- `pushPropsTopicAlias`
- `pushPropsResponseTopic`
- `pushPropsCorrelationData`
- `pushPropsUserProperties`
- `pushPropsSubscriptionIdentifier`
- `pushPropsContentType`

Relationships:

- Many-to-one `CollectionEntity` via `parentId` / `parent_id`, nullable, cascade delete.
- One-to-one `WillEntity`, cascade.
- One-to-many `MessageEntity`.
- One-to-many `SubscriptionEntity`.

Rewrite notes:

- Store connection properties and default publish properties as JSON blobs or grouped child tables; JSON is simpler for MQTT 5 extensibility.
- Store secrets carefully. Phase 1 does not decide encryption/keychain strategy, but the data model should allow moving passwords/cert material out of plain SQLite later.
- Rename `createAt`/`updateAt` to `created_at`/`updated_at` internally.

### `MessageEntity`

Purpose: persisted MQTT messages.

Fields:

- `id` UUID
- `createAt`
- `out` boolean direction flag
- `payload`
- `qos`: `0 | 1 | 2`
- `retain`
- `topic`
- `meta`
- `payloadFormatIndicator`
- `messageExpiryInterval`
- `topicAlias`
- `responseTopic`
- `correlationData`
- `userProperties`
- `subscriptionIdentifier`
- `contentType`
- `connection_id`

Relationship:

- Many-to-one `ConnectionEntity`; delete cascades with the connection.

Rewrite notes:

- Internally prefer `direction` (`received`/`published`) over `out`, but import/export must preserve MQTTX's `out` boolean.
- Index `connection_id`, `created_at`, `topic`, and `direction`.
- Use JSON for MQTT 5 properties if not querying them directly.

### `SubscriptionEntity`

Purpose: saved topic subscriptions.

Fields:

- `id` UUID
- `topic`
- `qos`: `0 | 1 | 2`
- `disabled`
- `alias`
- `retain`
- `nl` (No Local)
- `rap` (Retain As Published)
- `rh` (Retain Handling: `0 | 1 | 2`)
- `subscriptionIdentifier`
- `userProperties`
- `color`
- `createAt`
- `connection_id`

Relationship:

- Many-to-one `ConnectionEntity`; delete cascades with the connection.

Rewrite notes:

- Preserve MQTT 5 subscription options even if hidden for MQTT 3.x UI.
- Index by `connection_id` and `topic`.

### `WillEntity`

Purpose: MQTT Last Will and Testament per connection.

Fields:

- `id` UUID
- `lastWillTopic`
- `lastWillPayload`
- `lastWillQos`: `0 | 1 | 2`
- `lastWillRetain`
- `willDelayInterval`
- `payloadFormatIndicator`
- `messageExpiryInterval`
- `contentType`
- `responseTopic`
- `correlationData`
- `userProperties`

Relationship:

- One-to-one `ConnectionEntity`; delete cascades with the connection.

Rewrite notes:

- Store as nullable child row or embedded connection JSON. A child table maps cleanly to MQTTX imports.

### `SettingEntity`

Purpose: persisted application preferences.

Fields/defaults:

- `id` UUID
- `width`: `1025`
- `height`: `749`
- `autoCheck`: `true`
- `currentLang`: `en`
- `currentTheme`: `light`
- `maxReconnectTimes`: `10`
- `autoResub`: `true`
- `syncOsTheme`: `false`
- `multiTopics`: `true`
- `jsonHighlight`: `true`
- `enableCopilot`: `true`
- `openAIAPIHost`: `https://api.openai.com/v1`
- `openAIAPIKey`: empty string
- `model`: `gpt-4o`
- `logLevel`: `info`
- `ignoreQoS0Message`: `false`

Rewrite notes:

- Use a single settings table or key-value table.
- Do not persist deferred Copilot secrets unless Copilot is implemented.
- Add future settings from global state, such as payload size limits or hardware acceleration, only when features exist.

### `CollectionEntity`

Purpose: connection folder/group tree.

Expected fields from upstream model naming and usage:

- UUID `id`
- `name`
- `orderId`
- `isCollection` true for collection nodes
- parent/child relationships through a closure-table tree
- children containing `ConnectionEntity` or nested collections in the UI model

Rewrite notes:

- A simple adjacency-list table is likely enough for MVP.
- Preserve parent IDs and order IDs for import.

### `HistoryMessageHeaderEntity`

Purpose: cached publish header/topic choices.

Fields from global types:

- `topic`
- `qos`
- `retain`
- `connectionId`

Rewrite notes:

- Store as publish history metadata.
- Deduplicate repeated entries by connection/topic/QoS/retain.

### `HistoryMessagePayloadEntity`

Purpose: cached publish payload choices.

Fields from global types:

- `payload`
- `payloadType`
- `connectionId`

Rewrite notes:

- Preserve payload type to support codec-specific republishing.

### `ScriptEntity`

Purpose: user scripts and schema records.

Types from global definitions:

- `ScriptModel` / `FunctionModel`: `name`, `script`, `type`
- `SchemaModel`: `name`, `rawSchema`, `type` (`protobuf` or `avro`)
- `ScriptState`: apply target, function, schema, config
- `SchemaState`: apply target, schema options

Rewrite notes:

- Defer execution until scripting security model is designed.
- Import script/schema metadata as disabled records if needed for compatibility.

### `HistoryConnectionEntity`

Purpose: recently used connection history.

Rewrite notes:

- Treat as optional convenience data.
- Can be regenerated from connection usage; not critical for MVP import.

### `CopilotEntity`

Purpose: AI/Copilot message persistence.

Fields from global type:

- `id`
- `role`: user/system/assistant
- `content`
- `createAt`

Rewrite notes:

- Defer with AI/Copilot feature.
- Do not import API keys into active settings unless user confirms during future AI implementation.

### `DashboardEntity`

Purpose: dashboard configuration.

Fields from global type:

- `name`
- `description`
- `orderId`
- `globalSettings`
- `widgets[]`
- timestamps

Rewrite notes:

- Defer until dashboard phase.

### `WidgetEntity`

Purpose: dashboard widget configuration.

Fields from global type include:

- Type: Big Number, Gauge, Line
- Position: `x`, `y`, `w`, `h`
- Sizing constraints
- `dashboardId`
- `connectionId`
- `topicPattern`
- `valueField`
- `fallbackValue`
- schema type/id/message name
- validation state
- widget options: thresholds, min/max, decimals, unit, colors, smooth/area for line charts

Rewrite notes:

- Defer with dashboards.

### `TopicNodeEntity`

Purpose: topic tree persistence/visualization.

Types from global definitions:

- `TopicTreeNode`: label, message count, sub-topic count, message, connection info, children
- `EChartsTreeNode`: chart-ready node with `name`, `lastMessage`, `data`

Rewrite notes:

- Defer until topic tree visualization is implemented.

## Relationship summary

```text
CollectionEntity
  ├─ child CollectionEntity nodes
  └─ ConnectionEntity records

ConnectionEntity
  ├─ WillEntity (one-to-one)
  ├─ MessageEntity[]
  └─ SubscriptionEntity[]

DashboardEntity
  └─ WidgetEntity[]

TopicNodeEntity
  └─ topic tree state
```

## Import/export data shape

Core MQTTX-compatible export should support:

```json
{
  "connections": [
    {
      "id": "uuid",
      "clientId": "mqttx_client",
      "name": "Local broker",
      "host": "localhost",
      "port": 1883,
      "protocol": "mqtt",
      "mqttVersion": "5.0",
      "subscriptions": [],
      "messages": [],
      "will": null,
      "properties": {},
      "parentId": null
    }
  ],
  "collections": [],
  "settings": {},
  "scripts": [],
  "dashboards": []
}
```

Exact exported structure should be validated against upstream `ConnectionService`, `MessageService`, `SubscriptionService`, `WillService`, `SettingService`, and import/export components before Phase 3 storage work begins.

## Planned SQLite tables for rewrite

| Table | Purpose | Notes |
|---|---|---|
| `collections` | Connection folders | adjacency list with `parent_id`, `order_id` |
| `connections` | Broker connection configs | core fields plus JSON property groups |
| `connection_tls` or JSON fields | certificate/TLS config | separate table if secrets/cert paths need lifecycle management |
| `wills` | Last Will config | one row per connection |
| `subscriptions` | Saved subscriptions | includes MQTT 5 options |
| `messages` | Message history | indexed by connection/time/topic/direction |
| `publish_history_headers` | topic/qos/retain history | supports composer recall |
| `publish_history_payloads` | payload history | stores payload type |
| `settings` | app settings | key-value or singleton row |
| `scripts` | deferred scripts/schemas | disabled until scripting phase |
| `dashboards` | deferred dashboard configs | future |
| `widgets` | deferred dashboard widgets | future |
| `copilot_messages` | deferred AI chat history | future |
| `topic_nodes` | deferred topic tree cache | future |

## Type mapping

| MQTTX TypeScript / TypeORM | Go | SQLite |
|---|---|---|
| `string` / `varchar` | `string` or `sql.NullString` | `TEXT` |
| UUID string | `string` | `TEXT PRIMARY KEY` |
| `number` / `integer` | `int`, `int64`, or nullable wrapper | `INTEGER` |
| `boolean` | `bool` or nullable wrapper | `INTEGER` (`0/1`) |
| `datetime` string/date | `time.Time` | `TEXT` ISO-8601 or `INTEGER` unix millis |
| simple enum | named Go string/int type | `TEXT` or `INTEGER` with CHECK |
| object/user properties | struct/map serialized as JSON | `TEXT` or `JSON` affinity |
| nullable field | pointer or `sql.Null*` | nullable column |

## Migration history

The upstream project has a long TypeORM migration history (37 migrations observed in planning) covering schema evolution from the original connection/message model through MQTT 5 properties, scripts, settings, dashboards/widgets, Copilot, topic nodes, and hardware acceleration-related settings.

Rewrite implications:

- Do not reproduce every TypeORM migration one-for-one.
- Start with clean migrations for the new schema.
- Provide a separate MQTTX import path for legacy data rather than running TypeORM migrations.
- Keep the audited upstream revision in import tests so future MQTTX changes can be compared explicitly.

## Data-model risks

- MQTTX stores some structured fields such as `userProperties` as strings; rewrite must avoid double-encoding JSON.
- MQTTX uses `undefined` semantics in exports; Go does not. Sentinel values must be mapped intentionally.
- Secrets may exist in connection exports. Import UX should warn users and avoid accidental disclosure in logs.
- Message history can grow large. Storage phase must include indexes and cleanup policies.
- Deferred entities should still be recognized during import so users do not silently lose data.

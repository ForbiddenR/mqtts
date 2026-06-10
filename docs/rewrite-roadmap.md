# Rewrite Roadmap

Phase 1 deliverable for `mqtts`, a Wails + React + Go rewrite of MQTTX.

- Upstream project: <https://github.com/emqx/MQTTX>
- Upstream revision audited: `a8a9087fd6a9b434300bf4882c7978c9196ac674`
- Related docs: [`feature-audit.md`](feature-audit.md), [`mqttx-compatibility.md`](mqttx-compatibility.md), [`data-model.md`](data-model.md)

## Product priority tiers

### P0: Functional desktop MQTT client

- Wails v2 desktop shell.
- React 19 + TypeScript + Tailwind frontend.
- Go backend service bindings.
- MQTT connection CRUD.
- Multiple active connections.
- MQTT 3.1, 3.1.1, and 5.0.
- TCP, TLS, WebSocket, and secure WebSocket.
- Username/password authentication.
- TLS server/self-signed certificate configuration.
- Subscribe/unsubscribe.
- Publish composer.
- Received/published message timeline.
- Message persistence.
- Core settings: theme, reconnect, auto-resubscribe, log level, QoS 0 filtering.

### P1: Practical MQTTX migration and daily-use parity

- JSON import/export compatible with MQTTX core connection data.
- Search/filtering.
- Message inspector.
- Publish history.
- Payload display modes: plaintext, JSON, Base64, Hex.
- MQTT 5 properties exposed across connection, publish, subscription, and will forms.
- Dark/light theme.
- Application logs.
- Basic i18n structure if required.

### P2: Advanced MQTTX parity

- YAML/XML/CSV/Excel import/export.
- CBOR and MessagePack payload codecs.
- Protobuf and Avro schema support.
- Topic tree visualization.
- Timed publishing.
- Scripting import/storage and a secure execution design.
- More complete settings parity.

### P3: Extended product surfaces

- AI/Copilot and MCP support.
- Dashboard widgets: Big Number, Gauge, Line.
- Full scripting execution environment.
- CLI reuse built on Go core.
- Web deployment.
- Auto-update infrastructure.

## Refined implementation phases

### Phase 1: Discovery and Feature Audit — complete with these docs

Deliverables:

- `docs/feature-audit.md`
- `docs/mqttx-compatibility.md`
- `docs/data-model.md`
- `docs/rewrite-roadmap.md`

### Phase 2: Project Bootstrap

Goal: create a runnable Wails + React + Go application scaffold.

Tasks:

1. Verify installed Go, Bun, and Wails versions.
2. Initialize Wails v2 project in the current repository, not a nested folder.
3. Configure React 19 + TypeScript + Vite.
4. Configure Tailwind CSS.
5. Add frontend/backend bridge smoke test.
6. Add minimal app shell with navigation placeholders for Connections, Messages, Settings, Import/Export, and Logs.
7. Add initial lint/typecheck/test scripts only after package manifests exist.
8. Update `CLAUDE.md` with real commands.

Acceptance:

- `wails dev` or equivalent project command starts the app.
- React renders successfully.
- Frontend can call a Go backend method.
- Tailwind styles are visible.

### Phase 3: Storage Layer

Goal: define stable local persistence before feature work depends on it.

Tasks:

1. Choose SQLite access layer for Go.
2. Create migrations for `connections`, `collections`, `wills`, `subscriptions`, `messages`, `settings`, and publish history.
3. Define Go domain models separate from import/export DTOs.
4. Add repository/service interfaces.
5. Add indexes for message history.
6. Add seed/default settings.
7. Add migration tests.

Acceptance:

- `go test ./...` passes for storage packages.
- A fresh database is created and migrated.
- CRUD tests pass for core tables.

### Phase 4: MQTT Core

Goal: match MQTTX protocol behavior in Go.

Tasks:

1. Evaluate Go MQTT libraries against `docs/mqttx-compatibility.md`.
2. Verify MQTT 3.1 protocol ID support.
3. Verify MQTT 5 properties support.
4. Verify WebSocket path support.
5. Verify TLS and client certificates.
6. Implement connection manager with multiple sessions.
7. Implement connect/disconnect/reconnect behavior.
8. Implement subscribe/unsubscribe/publish.
9. Emit Wails runtime events for connection state, messages, errors, and logs.

Acceptance:

- Integration tests against a local broker cover MQTT 3.1.1 and MQTT 5.
- Manual smoke test can connect, subscribe, publish, and receive.

### Phase 5: Connection UI

Goal: make saved connections usable from the desktop app.

Tasks:

1. Build connection list/tree.
2. Build connection create/edit form.
3. Include protocol, auth, TLS, will, reconnect, and core MQTT 5 fields.
4. Persist connections through Go services.
5. Connect/disconnect from UI.
6. Display connection state and unread counts.

Acceptance:

- User can create, edit, delete, connect, and disconnect a broker connection.

### Phase 6: Messaging Workspace

Goal: implement the core MQTT workbench.

Tasks:

1. Build subscription panel.
2. Build publish composer.
3. Build message timeline.
4. Build message inspector.
5. Persist incoming and outgoing messages.
6. Add message pagination and filters.
7. Add publish history.

Acceptance:

- User can subscribe, publish, receive, inspect, and search/filter messages.

### Phase 7: Import/Export

Goal: allow migration from MQTTX.

Tasks:

1. Implement JSON importer for MQTTX core records.
2. Decode sentinel values from `docs/mqttx-compatibility.md`.
3. Validate required fields and cert combinations.
4. Report unsupported/deferred data clearly.
5. Implement JSON export.
6. Add YAML/XML/CSV/Excel later if still P2.

Acceptance:

- A representative MQTTX export imports without losing P0/P1 fields.
- Deferred fields are reported, not silently dropped.

### Phase 8: Settings and Logs

Goal: support durable app preferences and troubleshooting.

Tasks:

1. Implement settings UI and backend service.
2. Add theme support.
3. Add reconnect/auto-resubscribe/QoS 0/log-level settings.
4. Add application log view.
5. Add cleanup controls for message history.

Acceptance:

- Settings persist across app restarts.
- Logs help diagnose connection failures.

### Phase 9: Payload Codecs and Formatting

Goal: reach daily-use payload parity.

Tasks:

1. Implement plaintext, JSON, Base64, and Hex display/compose modes.
2. Add formatter/error handling.
3. Add CBOR and MessagePack.
4. Add Protobuf and Avro schema storage/decoding.
5. Keep raw payload safe when decoding fails.

Acceptance:

- Users can switch payload display/compose modes without data loss.

### Phase 10: Advanced Features

Goal: selectively add MQTTX advanced features.

Tasks:

1. Timed publishing.
2. Topic tree visualization.
3. Secure scripting design.
4. Script/schema import and application.
5. Dashboard widgets if product direction still requires them.

Acceptance:

- Each feature has isolated tests and can be disabled if unstable.

### Phase 11: AI/Copilot

Goal: decide whether AI belongs in the rewrite after core product stabilizes.

Tasks:

1. Define explicit user value and privacy/security model.
2. Reassess supported providers.
3. Reassess MCP support.
4. Add credentials storage design.
5. Implement only if it does not compromise core MQTT UX.

Acceptance:

- AI features are optional and disabled by default unless deliberately enabled.

### Phase 12: Packaging, QA, and Release

Goal: ship a reliable desktop app.

Tasks:

1. Cross-platform Wails builds.
2. CI for Go tests, frontend typecheck/lint/tests, and build.
3. Manual QA matrix with brokers and protocols.
4. Migration tests using MQTTX exports.
5. Release packaging.
6. Auto-update decision.

Acceptance:

- Builds are reproducible.
- P0/P1 workflows pass on supported platforms.

## Dependency order

```text
Bootstrap
  -> Storage
    -> MQTT Core
      -> Connection UI
        -> Messaging Workspace
          -> Import/Export
          -> Settings/Logs
            -> Payload Codecs
              -> Advanced Features
                -> AI/Dashboard/Packaging refinements
```

Key blockers:

- MQTT library choice blocks protocol compatibility.
- Storage model blocks import/export and UI persistence.
- Event contract blocks message timeline, topic tree, dashboards, and logs.
- Payload codec interface blocks schema support and dashboard value extraction.

## Go MQTT library evaluation criteria

The selected Go MQTT client must be tested against this checklist before committing:

- MQTT 3.1 protocol ID support (`MQIsdp`).
- MQTT 3.1.1 and 5.0 support.
- MQTT 5 connection, publish, subscription, and will properties.
- Clean/session expiry behavior equivalent to MQTTX.
- TCP/TLS/WebSocket/Secure WebSocket support.
- WebSocket path customization.
- Username/password behavior differences between MQTT 3.x and 5.0.
- TLS CA/client certificate configuration.
- ALPN support.
- Manual reconnect control.
- Auto-resubscribe behavior or hooks to implement it.
- SCRAM/enhanced authentication feasibility.
- Error reporting suitable for Wails events.

## Risk register

| Risk | Impact | Mitigation |
|---|---:|---|
| Go MQTT library does not match MQTT.js behavior | High | Build a broker compatibility test suite before deep UI work. |
| MQTT 5 property coverage is incomplete | High | Model property groups explicitly and test connect/publish/subscribe/will flows. |
| Import/export loses edge-case values | High | Decode sentinel values and maintain separate import DTOs. |
| Message history grows too large | Medium | Add indexes, pagination, cleanup policies, and payload size limits. |
| Secrets stored unsafely | High | Design credential storage before production release; avoid logging secrets. |
| Scripting execution is unsafe | High | Defer execution until sandbox/security model is approved. |
| AI/Copilot bloats MVP | Medium | Keep P3 and optional. |
| Dashboard widgets distract from core MQTT workflow | Medium | Defer until message pipeline is stable. |
| Wails runtime differs from Electron for updates/system features | Medium | Treat Electron-specific behavior as reimplementation, not parity. |
| Upstream MQTTX changes after audit | Medium | Pin audited commit and rerun audit before import compatibility release. |

## Deferred feature log

| Feature | Deferral reason | Revisit after |
|---|---|---|
| AI/Copilot/MCP | Large privacy, credentials, provider, and UX scope | P0/P1 complete |
| Dashboard widgets | Separate visualization product surface | Stable message pipeline and topic tree |
| Full scripting execution | Security-sensitive | Secure sandbox design |
| CLI | Not part of Wails desktop MVP | Shared Go core stabilizes |
| Web deployment | Not part of desktop rewrite | Desktop release |
| Auto-update parity | Wails-specific release strategy needed | Packaging phase |
| Hardware acceleration toggle | Electron-specific behavior | Wails platform QA |
| YAML/XML/CSV/Excel import/export | Secondary to JSON migration path | JSON import/export complete |

## Immediate next steps after Phase 1

1. Start Phase 2 project bootstrap in the current repository.
2. Verify Go, Bun, and Wails availability.
3. Scaffold Wails + React app without nesting an extra project folder.
4. Update `CLAUDE.md` with actual commands only after manifests/config files exist.
5. Begin Phase 3 storage design using `docs/data-model.md` as the schema reference.

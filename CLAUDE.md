# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

This repository is currently a planning scaffold for `mqtts`, a planned React 19 + Go 1.26.4 + Wails v2 rewrite of MQTTX with Tailwind CSS and SQLite persistence.

Current files:

- `README.md` — contains the project name.
- `PLAN.md` — contains the product scope, target stack, proposed architecture, implementation phases, milestones, data model draft, and technical risks for the rewrite.
- `docs/feature-audit.md` — Phase 1 MQTTX feature inventory and include/defer/exclude decisions.
- `docs/mqttx-compatibility.md` — Phase 1 MQTTX behavior and import/export compatibility checklist.
- `docs/data-model.md` — Phase 1 MQTTX persistence model audit and planned SQLite mapping notes.
- `docs/rewrite-roadmap.md` — Phase 1 refined rewrite roadmap and risk register.

Phase 1 (Discovery and Feature Audit) is complete. There are still no application source files, package manifests, Go modules, Wails config, build scripts, tests, Cursor rules, or Copilot instructions yet.

## Commands

No project-specific build, lint, test, or development commands are currently defined because the app has not been scaffolded yet.

Planned tooling from `PLAN.md`:

- Bun, latest stable, for frontend package management and scripts
- React 19 + TypeScript + Vite for the frontend
- Tailwind CSS for styling
- Go 1.26.4 for the backend
- Wails v2 for the desktop shell
- SQLite for local persistence

Once the project is scaffolded, update this section with the actual commands. Expected command categories include:

- Bun install command
- Wails dev command
- Wails production build command
- Frontend typecheck/lint/test commands
- Backend `go test ./...`
- Single frontend test command
- Single Go test command

Do not invent commands before the relevant `package.json`, `go.mod`, `wails.json`, or task runner files exist.

## Architecture

The concrete code architecture does not exist yet. Use `PLAN.md` as the source of truth for intended direction until source files are created.

Planned high-level architecture:

- Wails v2 desktop app with Go backend services exposed to a React frontend through generated bindings.
- React 19 frontend organized by feature modules such as connections, messages, publishing, subscriptions, settings, and import/export.
- Go backend organized around MQTT connection management, local storage, configuration, certificates, import/export, and system integration.
- SQLite persistence for connections, subscriptions, messages, publish history, settings, payload templates, and certificate metadata.
- Wails runtime events for real-time MQTT updates from Go to React.

Planned backend responsibilities:

- Manage multiple active MQTT client sessions.
- Connect/disconnect from brokers.
- Publish and subscribe/unsubscribe.
- Support MQTT 3.1, 3.1.1, and 5.0.
- Support TCP, TLS, WebSocket, and secure WebSocket connections.
- Persist message and connection history.
- Emit connection, message, subscription, error, and log events to the frontend.

Planned frontend responsibilities:

- Modern desktop UI with Tailwind CSS.
- Connection manager and connection form.
- Multi-connection workspace.
- Subscription panel.
- Publish composer.
- Message timeline and message inspector.
- Search/filtering, payload formatting, and dark/light theme.
- Settings and import/export screens.

## Important planning references

Before implementing, read `PLAN.md` and the Phase 1 docs in `docs/`. `PLAN.md` contains:

- Target stack and toolchain requirements
- Product scope
- Proposed project structure
- Wails backend API sketch
- MQTT manager responsibilities
- Frontend module layout
- Data model draft
- Backend event contract
- Implementation phases and milestones
- Technical risks

Phase 1 docs contain:

- `docs/feature-audit.md` — upstream MQTTX feature inventory and priority decisions.
- `docs/mqttx-compatibility.md` — MQTT.js behavior, MQTT 5 behavior, and import/export compatibility checklist.
- `docs/data-model.md` — upstream TypeORM/SQLite model audit and planned Go/SQLite mapping guidance.
- `docs/rewrite-roadmap.md` — refined phase sequencing, dependencies, deferred features, and risk register.

When the app is scaffolded, keep this file updated with the actual architecture and commands rather than only the planned architecture.

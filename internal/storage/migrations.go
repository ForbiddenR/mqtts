package storage

type migration struct {
	sql string
}

var migrations = []migration{
	// 0: collections
	{
		sql: `
CREATE TABLE collections (
		id            TEXT PRIMARY KEY,
		name          TEXT NOT NULL DEFAULT '',
		order_id      INTEGER NOT NULL DEFAULT 0,
		is_collection INTEGER NOT NULL DEFAULT 1,
		parent_id     TEXT,
		FOREIGN KEY (parent_id) REFERENCES collections(id) ON DELETE CASCADE
	);
CREATE INDEX idx_collections_parent_id ON collections(parent_id);
`,
	},
	// 1: connections
	{
		sql: `
CREATE TABLE connections (
		id                     TEXT PRIMARY KEY,
		client_id              TEXT NOT NULL DEFAULT '',
		name                   TEXT NOT NULL DEFAULT '',
		clean                  INTEGER NOT NULL DEFAULT 1,
		protocol               TEXT NOT NULL DEFAULT 'mqtt',
		host                   TEXT NOT NULL DEFAULT '',
		port                   INTEGER NOT NULL DEFAULT 1883,
		keepalive              INTEGER NOT NULL DEFAULT 60,
		connect_timeout        INTEGER NOT NULL DEFAULT 10,
		reconnect              INTEGER NOT NULL DEFAULT 0,
		reconnect_period       INTEGER NOT NULL DEFAULT 4000,
		username               TEXT,
		password               TEXT,
		path                   TEXT,
		ssl                    INTEGER NOT NULL DEFAULT 0,
		mqtt_version           TEXT NOT NULL DEFAULT '3.1.1',
		unread_message_count   INTEGER NOT NULL DEFAULT 0,
		client_id_with_time    INTEGER NOT NULL DEFAULT 0,
		order_id               INTEGER NOT NULL DEFAULT 0,
		is_collection          INTEGER NOT NULL DEFAULT 0,
		parent_id              TEXT,
		created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		cert_type              TEXT NOT NULL DEFAULT '',
		reject_unauthorized    INTEGER NOT NULL DEFAULT 1,
		alpn_protocols         TEXT,
		ca                     TEXT NOT NULL DEFAULT '',
		cert                   TEXT NOT NULL DEFAULT '',
		key                    TEXT NOT NULL DEFAULT '',
		mqtt5_properties       TEXT,
		push_props             TEXT,
		FOREIGN KEY (parent_id) REFERENCES collections(id) ON DELETE SET NULL
	);
CREATE INDEX idx_connections_parent_id ON connections(parent_id);
CREATE INDEX idx_connections_order_id ON connections(order_id);
`,
	},
	// 2: wills
	{
		sql: `
CREATE TABLE wills (
		id                      TEXT PRIMARY KEY,
		last_will_topic         TEXT NOT NULL DEFAULT '',
		last_will_payload       TEXT NOT NULL DEFAULT '',
		last_will_qos           INTEGER NOT NULL DEFAULT 0,
		last_will_retain        INTEGER NOT NULL DEFAULT 0,
		will_delay_interval     INTEGER,
		payload_format_indicator INTEGER,
		message_expiry_interval INTEGER,
		content_type            TEXT,
		response_topic          TEXT,
		correlation_data        TEXT,
		user_properties         TEXT,
		connection_id           TEXT NOT NULL UNIQUE,
		FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
	);
`,
	},
	// 3: subscriptions
	{
		sql: `
CREATE TABLE subscriptions (
		id                      TEXT PRIMARY KEY,
		topic                   TEXT NOT NULL DEFAULT '',
		qos                     INTEGER NOT NULL DEFAULT 0,
		disabled                INTEGER NOT NULL DEFAULT 0,
		alias                   TEXT,
		retain                  INTEGER NOT NULL DEFAULT 0,
		nl                      INTEGER NOT NULL DEFAULT 0,
		rap                     INTEGER NOT NULL DEFAULT 0,
		rh                      INTEGER NOT NULL DEFAULT 0,
		subscription_identifier INTEGER,
		user_properties         TEXT,
		color                   TEXT,
		created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		connection_id           TEXT NOT NULL,
		FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
	);
CREATE INDEX idx_subscriptions_connection_id ON subscriptions(connection_id);
CREATE INDEX idx_subscriptions_topic ON subscriptions(topic);
`,
	},
	// 4: messages
	{
		sql: `
CREATE TABLE messages (
		id                      TEXT PRIMARY KEY,
		created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		out                     INTEGER NOT NULL DEFAULT 0,
		payload                 TEXT NOT NULL DEFAULT '',
		qos                     INTEGER NOT NULL DEFAULT 0,
		retain                  INTEGER NOT NULL DEFAULT 0,
		topic                   TEXT NOT NULL DEFAULT '',
		meta                    TEXT,
		payload_format_indicator INTEGER,
		message_expiry_interval INTEGER,
		topic_alias             INTEGER,
		response_topic          TEXT,
		correlation_data        TEXT,
		user_properties         TEXT,
		subscription_identifier INTEGER,
		content_type            TEXT,
		connection_id           TEXT NOT NULL,
		FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
	);
CREATE INDEX idx_messages_connection_id ON messages(connection_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_topic ON messages(topic);
CREATE INDEX idx_messages_out ON messages(out);
`,
	},
	// 5: publish history headers
	{
		sql: `
CREATE TABLE publish_history_headers (
		id            INTEGER PRIMARY KEY AUTOINCREMENT,
		topic         TEXT NOT NULL DEFAULT '',
		qos           INTEGER NOT NULL DEFAULT 0,
		retain        INTEGER NOT NULL DEFAULT 0,
		connection_id TEXT NOT NULL DEFAULT ''
	);
CREATE UNIQUE INDEX idx_phh_dedup ON publish_history_headers(connection_id, topic, qos, retain);
`,
	},
	// 6: publish history payloads
	{
		sql: `
CREATE TABLE publish_history_payloads (
		id            INTEGER PRIMARY KEY AUTOINCREMENT,
		payload       TEXT NOT NULL DEFAULT '',
		payload_type  TEXT NOT NULL DEFAULT 'plaintext',
		connection_id TEXT NOT NULL DEFAULT ''
	);
`,
	},
	// 7: settings
	{
		sql: `
CREATE TABLE settings (
		id                   TEXT PRIMARY KEY,
		width                INTEGER NOT NULL DEFAULT 1025,
		height               INTEGER NOT NULL DEFAULT 749,
		auto_check           INTEGER NOT NULL DEFAULT 1,
		current_lang         TEXT NOT NULL DEFAULT 'en',
		current_theme        TEXT NOT NULL DEFAULT 'light',
		max_reconnect_times  INTEGER NOT NULL DEFAULT 10,
		auto_resub           INTEGER NOT NULL DEFAULT 1,
		sync_os_theme        INTEGER NOT NULL DEFAULT 0,
		multi_topics         INTEGER NOT NULL DEFAULT 1,
		json_highlight       INTEGER NOT NULL DEFAULT 1,
		enable_copilot       INTEGER NOT NULL DEFAULT 0,
		open_ai_api_host     TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
		open_ai_api_key      TEXT NOT NULL DEFAULT '',
		model                TEXT NOT NULL DEFAULT 'gpt-4o',
		log_level            TEXT NOT NULL DEFAULT 'info',
		ignore_qos0_message  INTEGER NOT NULL DEFAULT 0
	);
`,
	},
	// 9: add payload_templates to settings
	{
		sql: `ALTER TABLE settings ADD COLUMN payload_templates TEXT NOT NULL DEFAULT '[]';`,
	},
	// 10: add last_connection_id to settings
	{
		sql: `ALTER TABLE settings ADD COLUMN last_connection_id TEXT NOT NULL DEFAULT '';`,
	},
}

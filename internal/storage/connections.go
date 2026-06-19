package storage

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/nictoarch/mqtts/internal/models"
)

// ConnectionRepo provides CRUD operations for MQTT connections.
type ConnectionRepo struct {
	db *sql.DB
}

func (r *ConnectionRepo) Create(ctx context.Context, c *models.Connection) error {
	if c.ID == "" {
		c.ID = newUUID()
	}
	now := time.Now()
	if c.CreatedAt.IsZero() {
		c.CreatedAt = now
	}
	if c.UpdatedAt.IsZero() {
		c.UpdatedAt = now
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO connections (
			id, client_id, name, clean, protocol, host, port, keepalive,
			connect_timeout, reconnect, reconnect_period, username, password,
			path, ssl, mqtt_version, unread_message_count, client_id_with_time,
			order_id, is_collection, parent_id, created_at, updated_at,
			cert_type, reject_unauthorized, alpn_protocols, ca, cert, key,
			mqtt5_properties, push_props
		) VALUES (
			?, ?, ?, ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?,
			?, ?, ?, ?, ?,
			?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?,
			?, ?
		)`,
		c.ID, c.ClientID, c.Name, boolToInt(c.Clean), string(c.Protocol), c.Host, c.Port, c.KeepAlive,
		c.ConnectTimeout, boolToInt(c.Reconnect), c.ReconnectPeriod, nullString(c.Username), nullString(c.Password),
		nullString(c.Path), boolToInt(c.SSL), c.MQTTVersion, c.UnreadMessageCount, boolToInt(c.ClientIDWithTime),
		c.OrderID, boolToInt(c.IsCollection), nullString(c.ParentID), c.CreatedAt, c.UpdatedAt,
		string(c.CertType), boolToInt(c.RejectUnauthorized), nullString(c.ALPNProtocols), c.CA, c.Cert, c.Key,
		models.ToJSON(c.MQTT5Properties), models.ToJSON(c.PushProps),
	)
	if err != nil {
		return fmt.Errorf("insert connection: %w", err)
	}
	return nil
}

func (r *ConnectionRepo) Get(ctx context.Context, id string) (*models.Connection, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, client_id, name, clean, protocol, host, port, keepalive,
			connect_timeout, reconnect, reconnect_period, username, password,
			path, ssl, mqtt_version, unread_message_count, client_id_with_time,
			order_id, is_collection, parent_id, created_at, updated_at,
			cert_type, reject_unauthorized, alpn_protocols, ca, cert, key,
			mqtt5_properties, push_props
		FROM connections WHERE id = ?
	`, id)
	return scanConnection(row)
}

func (r *ConnectionRepo) List(ctx context.Context) ([]models.Connection, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, client_id, name, clean, protocol, host, port, keepalive,
			connect_timeout, reconnect, reconnect_period, username, password,
			path, ssl, mqtt_version, unread_message_count, client_id_with_time,
			order_id, is_collection, parent_id, created_at, updated_at,
			cert_type, reject_unauthorized, alpn_protocols, ca, cert, key,
			mqtt5_properties, push_props
		FROM connections ORDER BY order_id, created_at
	`)
	if err != nil {
		return nil, fmt.Errorf("list connections: %w", err)
	}
	defer rows.Close()

	var conns []models.Connection
	for rows.Next() {
		c, err := scanConnectionRows(rows)
		if err != nil {
			return nil, err
		}
		conns = append(conns, *c)
	}
	return conns, rows.Err()
}

func (r *ConnectionRepo) Update(ctx context.Context, c *models.Connection) error {
	c.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, `
		UPDATE connections SET
			client_id = ?, name = ?, clean = ?, protocol = ?, host = ?, port = ?, keepalive = ?,
			connect_timeout = ?, reconnect = ?, reconnect_period = ?, username = ?, password = ?,
			path = ?, ssl = ?, mqtt_version = ?, unread_message_count = ?, client_id_with_time = ?,
			order_id = ?, is_collection = ?, parent_id = ?, updated_at = ?,
			cert_type = ?, reject_unauthorized = ?, alpn_protocols = ?, ca = ?, cert = ?, key = ?,
			mqtt5_properties = ?, push_props = ?
		WHERE id = ?`,
		c.ClientID, c.Name, boolToInt(c.Clean), string(c.Protocol), c.Host, c.Port, c.KeepAlive,
		c.ConnectTimeout, boolToInt(c.Reconnect), c.ReconnectPeriod, nullString(c.Username), nullString(c.Password),
		nullString(c.Path), boolToInt(c.SSL), c.MQTTVersion, c.UnreadMessageCount, boolToInt(c.ClientIDWithTime),
		c.OrderID, boolToInt(c.IsCollection), nullString(c.ParentID), c.UpdatedAt,
		string(c.CertType), boolToInt(c.RejectUnauthorized), nullString(c.ALPNProtocols), c.CA, c.Cert, c.Key,
		models.ToJSON(c.MQTT5Properties), models.ToJSON(c.PushProps),
		c.ID,
	)
	if err != nil {
		return fmt.Errorf("update connection: %w", err)
	}
	return nil
}

func (r *ConnectionRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM connections WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("delete connection: %w", err)
	}
	return nil
}

func (r *ConnectionRepo) IncrementUnread(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE connections SET unread_message_count = unread_message_count + 1 WHERE id = ?", id)
	return err
}

func (r *ConnectionRepo) ResetUnread(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx,
		"UPDATE connections SET unread_message_count = 0 WHERE id = ?", id)
	return err
}

func scanConnection(row *sql.Row) (*models.Connection, error) {
	var c models.Connection
	var mqtt5JSON, pushJSON sql.NullString
	var username, password, path, parentID, alpn sql.NullString

	err := row.Scan(
		&c.ID, &c.ClientID, &c.Name, &c.Clean, &c.Protocol, &c.Host, &c.Port, &c.KeepAlive,
		&c.ConnectTimeout, &c.Reconnect, &c.ReconnectPeriod, &username, &password,
		&path, &c.SSL, &c.MQTTVersion, &c.UnreadMessageCount, &c.ClientIDWithTime,
		&c.OrderID, &c.IsCollection, &parentID, &c.CreatedAt, &c.UpdatedAt,
		&c.CertType, &c.RejectUnauthorized, &alpn, &c.CA, &c.Cert, &c.Key,
		&mqtt5JSON, &pushJSON,
	)
	if err != nil {
		return nil, fmt.Errorf("scan connection: %w", err)
	}

	c.Username = username.String
	c.Password = password.String
	c.Path = path.String
	c.ParentID = parentID.String
	c.ALPNProtocols = alpn.String

	if mqtt5JSON.Valid {
		c.MQTT5Properties = &models.MQTT5Properties{}
		models.FromJSON([]byte(mqtt5JSON.String), c.MQTT5Properties)
	}
	if pushJSON.Valid {
		c.PushProps = &models.PushProperties{}
		models.FromJSON([]byte(pushJSON.String), c.PushProps)
	}

	return &c, nil
}

func scanConnectionRows(rows *sql.Rows) (*models.Connection, error) {
	var c models.Connection
	var mqtt5JSON, pushJSON sql.NullString
	var username, password, path, parentID, alpn sql.NullString

	err := rows.Scan(
		&c.ID, &c.ClientID, &c.Name, &c.Clean, &c.Protocol, &c.Host, &c.Port, &c.KeepAlive,
		&c.ConnectTimeout, &c.Reconnect, &c.ReconnectPeriod, &username, &password,
		&path, &c.SSL, &c.MQTTVersion, &c.UnreadMessageCount, &c.ClientIDWithTime,
		&c.OrderID, &c.IsCollection, &parentID, &c.CreatedAt, &c.UpdatedAt,
		&c.CertType, &c.RejectUnauthorized, &alpn, &c.CA, &c.Cert, &c.Key,
		&mqtt5JSON, &pushJSON,
	)
	if err != nil {
		return nil, fmt.Errorf("scan connection: %w", err)
	}

	c.Username = username.String
	c.Password = password.String
	c.Path = path.String
	c.ParentID = parentID.String
	c.ALPNProtocols = alpn.String

	if mqtt5JSON.Valid {
		c.MQTT5Properties = &models.MQTT5Properties{}
		models.FromJSON([]byte(mqtt5JSON.String), c.MQTT5Properties)
	}
	if pushJSON.Valid {
		c.PushProps = &models.PushProperties{}
		models.FromJSON([]byte(pushJSON.String), c.PushProps)
	}

	return &c, nil
}

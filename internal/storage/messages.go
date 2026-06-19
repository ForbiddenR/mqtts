package storage

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/nictoarch/mqtts/internal/models"
)

// MessageRepo provides CRUD operations for MQTT messages.
type MessageRepo struct {
	db *sql.DB
}

func (r *MessageRepo) Create(ctx context.Context, m *models.Message) error {
	if m.ID == "" {
		m.ID = newUUID()
	}
	if m.CreatedAt.IsZero() {
		m.CreatedAt = time.Now()
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO messages (
			id, created_at, out, payload, qos, retain, topic, meta,
			payload_format_indicator, message_expiry_interval, topic_alias,
			response_topic, correlation_data, user_properties,
			subscription_identifier, content_type, connection_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		m.ID, m.CreatedAt, boolToInt(m.Out), m.Payload, int(m.QoS), boolToInt(m.Retain),
		m.Topic, nullString(m.Meta),
		nullBool(m.PayloadFormatIndicator), nullInt(m.MessageExpiryInterval), nullInt(m.TopicAlias),
		nullString(m.ResponseTopic), nullString(m.CorrelationData),
		models.MarshalUserProperties(m.UserProperties),
		nullInt(m.SubscriptionIdentifier), nullString(m.ContentType), m.ConnectionID,
	)
	if err != nil {
		return fmt.Errorf("insert message: %w", err)
	}
	return nil
}

func (r *MessageRepo) Get(ctx context.Context, id string) (*models.Message, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, created_at, out, payload, qos, retain, topic, meta,
			payload_format_indicator, message_expiry_interval, topic_alias,
			response_topic, correlation_data, user_properties,
			subscription_identifier, content_type, connection_id
		FROM messages WHERE id = ?
	`, id)
	return scanMessage(row)
}

func (r *MessageRepo) ListByConnection(ctx context.Context, connID string, limit, offset int) ([]models.Message, int, error) {
	if limit <= 0 {
		limit = 50
	}

	var total int
	err := r.db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM messages WHERE connection_id = ?", connID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count messages: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT id, created_at, out, payload, qos, retain, topic, meta,
			payload_format_indicator, message_expiry_interval, topic_alias,
			response_topic, correlation_data, user_properties,
			subscription_identifier, content_type, connection_id
		FROM messages WHERE connection_id = ?
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, connID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("list messages: %w", err)
	}
	defer rows.Close()

	var msgs []models.Message
	for rows.Next() {
		m, err := scanMessageRows(rows)
		if err != nil {
			return nil, 0, err
		}
		msgs = append(msgs, *m)
	}
	return msgs, total, rows.Err()
}

func (r *MessageRepo) DeleteByConnection(ctx context.Context, connID string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM messages WHERE connection_id = ?", connID)
	return err
}

func scanMessage(row *sql.Row) (*models.Message, error) {
	var m models.Message
	var meta, responseTopic, correlationData, contentType sql.NullString
	var userProps sql.NullString
	var pfi sql.NullBool
	var mei, ta, si sql.NullInt64

	err := row.Scan(
		&m.ID, &m.CreatedAt, &m.Out, &m.Payload, &m.QoS, &m.Retain, &m.Topic, &meta,
		&pfi, &mei, &ta, &responseTopic, &correlationData, &userProps,
		&si, &contentType, &m.ConnectionID,
	)
	if err != nil {
		return nil, fmt.Errorf("scan message: %w", err)
	}

	m.Meta = meta.String
	m.ResponseTopic = responseTopic.String
	m.CorrelationData = correlationData.String
	m.ContentType = contentType.String

	if pfi.Valid {
		v := pfi.Bool
		m.PayloadFormatIndicator = &v
	}
	if mei.Valid {
		v := int(mei.Int64)
		m.MessageExpiryInterval = &v
	}
	if ta.Valid {
		v := int(ta.Int64)
		m.TopicAlias = &v
	}
	if si.Valid {
		v := int(si.Int64)
		m.SubscriptionIdentifier = &v
	}
	m.UserProperties = models.UnmarshalUserProperties([]byte(userProps.String))

	return &m, nil
}

func scanMessageRows(rows *sql.Rows) (*models.Message, error) {
	var m models.Message
	var meta, responseTopic, correlationData, contentType sql.NullString
	var userProps sql.NullString
	var pfi sql.NullBool
	var mei, ta, si sql.NullInt64

	err := rows.Scan(
		&m.ID, &m.CreatedAt, &m.Out, &m.Payload, &m.QoS, &m.Retain, &m.Topic, &meta,
		&pfi, &mei, &ta, &responseTopic, &correlationData, &userProps,
		&si, &contentType, &m.ConnectionID,
	)
	if err != nil {
		return nil, fmt.Errorf("scan message: %w", err)
	}

	m.Meta = meta.String
	m.ResponseTopic = responseTopic.String
	m.CorrelationData = correlationData.String
	m.ContentType = contentType.String

	if pfi.Valid {
		v := pfi.Bool
		m.PayloadFormatIndicator = &v
	}
	if mei.Valid {
		v := int(mei.Int64)
		m.MessageExpiryInterval = &v
	}
	if ta.Valid {
		v := int(ta.Int64)
		m.TopicAlias = &v
	}
	if si.Valid {
		v := int(si.Int64)
		m.SubscriptionIdentifier = &v
	}
	m.UserProperties = models.UnmarshalUserProperties([]byte(userProps.String))

	return &m, nil
}

package storage

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/nictoarch/mqtts/internal/models"
)

// WillRepo provides CRUD operations for MQTT Last Will configurations.
type WillRepo struct {
	db *sql.DB
}

func (r *WillRepo) Create(ctx context.Context, w *models.Will) error {
	if w.ID == "" {
		w.ID = newUUID()
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO wills (
			id, last_will_topic, last_will_payload, last_will_qos, last_will_retain,
			will_delay_interval, payload_format_indicator, message_expiry_interval,
			content_type, response_topic, correlation_data, user_properties, connection_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		w.ID, w.LastWillTopic, w.LastWillPayload, int(w.LastWillQoS), boolToInt(w.LastWillRetain),
		nullInt(w.WillDelayInterval), nullBool(w.PayloadFormatIndicator), nullInt(w.MessageExpiryInterval),
		nullString(w.ContentType), nullString(w.ResponseTopic), nullString(w.CorrelationData),
		models.MarshalUserProperties(w.UserProperties), w.ConnectionID,
	)
	if err != nil {
		return fmt.Errorf("insert will: %w", err)
	}
	return nil
}

func (r *WillRepo) GetByConnection(ctx context.Context, connID string) (*models.Will, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, last_will_topic, last_will_payload, last_will_qos, last_will_retain,
			will_delay_interval, payload_format_indicator, message_expiry_interval,
			content_type, response_topic, correlation_data, user_properties, connection_id
		FROM wills WHERE connection_id = ?
	`, connID)
	return scanWill(row)
}

func (r *WillRepo) Update(ctx context.Context, w *models.Will) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE wills SET
			last_will_topic = ?, last_will_payload = ?, last_will_qos = ?, last_will_retain = ?,
			will_delay_interval = ?, payload_format_indicator = ?, message_expiry_interval = ?,
			content_type = ?, response_topic = ?, correlation_data = ?, user_properties = ?
		WHERE connection_id = ?`,
		w.LastWillTopic, w.LastWillPayload, int(w.LastWillQoS), boolToInt(w.LastWillRetain),
		nullInt(w.WillDelayInterval), nullBool(w.PayloadFormatIndicator), nullInt(w.MessageExpiryInterval),
		nullString(w.ContentType), nullString(w.ResponseTopic), nullString(w.CorrelationData),
		models.MarshalUserProperties(w.UserProperties), w.ConnectionID,
	)
	if err != nil {
		return fmt.Errorf("update will: %w", err)
	}
	return nil
}

func (r *WillRepo) DeleteByConnection(ctx context.Context, connID string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM wills WHERE connection_id = ?", connID)
	return err
}

func scanWill(row *sql.Row) (*models.Will, error) {
	var w models.Will
	var contentType, responseTopic, correlationData sql.NullString
	var userProps sql.NullString
	var wdi, pfi, mei sql.NullInt64

	err := row.Scan(
		&w.ID, &w.LastWillTopic, &w.LastWillPayload, &w.LastWillQoS, &w.LastWillRetain,
		&wdi, &pfi, &mei, &contentType, &responseTopic, &correlationData,
		&userProps, &w.ConnectionID,
	)
	if err != nil {
		return nil, fmt.Errorf("scan will: %w", err)
	}

	w.ContentType = contentType.String
	w.ResponseTopic = responseTopic.String
	w.CorrelationData = correlationData.String

	if wdi.Valid {
		v := int(wdi.Int64)
		w.WillDelayInterval = &v
	}
	if pfi.Valid {
		v := pfi.Int64 != 0
		w.PayloadFormatIndicator = &v
	}
	if mei.Valid {
		v := int(mei.Int64)
		w.MessageExpiryInterval = &v
	}
	w.UserProperties = models.UnmarshalUserProperties([]byte(userProps.String))

	return &w, nil
}

package storage

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/nictoarch/mqtts/internal/models"
)

// PublishHistoryRepo provides operations for publish history headers and payloads.
type PublishHistoryRepo struct {
	db *sql.DB
}

func (r *PublishHistoryRepo) UpsertHeader(ctx context.Context, h *models.PublishHistoryHeader) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT OR REPLACE INTO publish_history_headers (topic, qos, retain, connection_id)
		VALUES (?, ?, ?, ?)`,
		h.Topic, int(h.QoS), boolToInt(h.Retain), h.ConnectionID,
	)
	if err != nil {
		return fmt.Errorf("upsert header: %w", err)
	}
	return nil
}

func (r *PublishHistoryRepo) ListHeaders(ctx context.Context, connID string) ([]models.PublishHistoryHeader, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT topic, qos, retain, connection_id
		FROM publish_history_headers
		WHERE connection_id = ?
		ORDER BY topic
	`, connID)
	if err != nil {
		return nil, fmt.Errorf("list headers: %w", err)
	}
	defer rows.Close()

	var headers []models.PublishHistoryHeader
	for rows.Next() {
		var h models.PublishHistoryHeader
		if err := rows.Scan(&h.Topic, &h.QoS, &h.Retain, &h.ConnectionID); err != nil {
			return nil, fmt.Errorf("scan header: %w", err)
		}
		headers = append(headers, h)
	}
	return headers, rows.Err()
}

func (r *PublishHistoryRepo) AddPayload(ctx context.Context, p *models.PublishHistoryPayload) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO publish_history_payloads (payload, payload_type, connection_id)
		VALUES (?, ?, ?)`,
		p.Payload, p.PayloadType, p.ConnectionID,
	)
	if err != nil {
		return fmt.Errorf("insert payload: %w", err)
	}
	return nil
}

func (r *PublishHistoryRepo) ListPayloads(ctx context.Context, connID string) ([]models.PublishHistoryPayload, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT payload, payload_type, connection_id
		FROM publish_history_payloads
		WHERE connection_id = ?
		ORDER BY id DESC
	`, connID)
	if err != nil {
		return nil, fmt.Errorf("list payloads: %w", err)
	}
	defer rows.Close()

	var payloads []models.PublishHistoryPayload
	for rows.Next() {
		var p models.PublishHistoryPayload
		if err := rows.Scan(&p.Payload, &p.PayloadType, &p.ConnectionID); err != nil {
			return nil, fmt.Errorf("scan payload: %w", err)
		}
		payloads = append(payloads, p)
	}
	return payloads, rows.Err()
}

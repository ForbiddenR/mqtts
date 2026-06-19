package storage

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/nictoarch/mqtts/internal/models"
)

// SubscriptionRepo provides CRUD operations for MQTT subscriptions.
type SubscriptionRepo struct {
	db *sql.DB
}

func (r *SubscriptionRepo) Create(ctx context.Context, s *models.Subscription) error {
	if s.ID == "" {
		s.ID = newUUID()
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO subscriptions (
			id, topic, qos, disabled, alias, retain, nl, rap, rh,
			subscription_identifier, user_properties, color, connection_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		s.ID, s.Topic, int(s.QoS), boolToInt(s.Disabled), nullString(s.Alias),
		boolToInt(s.Retain), boolToInt(s.NL), boolToInt(s.RAP), int(s.RH),
		nullInt(s.SubscriptionIdentifier), models.MarshalUserProperties(s.UserProperties),
		nullString(s.Color), s.ConnectionID,
	)
	if err != nil {
		return fmt.Errorf("insert subscription: %w", err)
	}
	return nil
}

func (r *SubscriptionRepo) Get(ctx context.Context, id string) (*models.Subscription, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, topic, qos, disabled, alias, retain, nl, rap, rh,
			subscription_identifier, user_properties, color, created_at, connection_id
		FROM subscriptions WHERE id = ?
	`, id)
	return scanSubscription(row)
}

func (r *SubscriptionRepo) ListByConnection(ctx context.Context, connID string) ([]models.Subscription, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, topic, qos, disabled, alias, retain, nl, rap, rh,
			subscription_identifier, user_properties, color, created_at, connection_id
		FROM subscriptions WHERE connection_id = ? ORDER BY created_at
	`, connID)
	if err != nil {
		return nil, fmt.Errorf("list subscriptions: %w", err)
	}
	defer rows.Close()

	var subs []models.Subscription
	for rows.Next() {
		s, err := scanSubscriptionRows(rows)
		if err != nil {
			return nil, err
		}
		subs = append(subs, *s)
	}
	return subs, rows.Err()
}

func (r *SubscriptionRepo) Update(ctx context.Context, s *models.Subscription) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE subscriptions SET
			topic = ?, qos = ?, disabled = ?, alias = ?, retain = ?, nl = ?, rap = ?, rh = ?,
			subscription_identifier = ?, user_properties = ?, color = ?
		WHERE id = ?`,
		s.Topic, int(s.QoS), boolToInt(s.Disabled), nullString(s.Alias),
		boolToInt(s.Retain), boolToInt(s.NL), boolToInt(s.RAP), int(s.RH),
		nullInt(s.SubscriptionIdentifier), models.MarshalUserProperties(s.UserProperties),
		nullString(s.Color), s.ID,
	)
	if err != nil {
		return fmt.Errorf("update subscription: %w", err)
	}
	return nil
}

func (r *SubscriptionRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM subscriptions WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("delete subscription: %w", err)
	}
	return nil
}

func (r *SubscriptionRepo) DeleteByConnection(ctx context.Context, connID string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM subscriptions WHERE connection_id = ?", connID)
	return err
}

func scanSubscription(row *sql.Row) (*models.Subscription, error) {
	var s models.Subscription
	var alias, color sql.NullString
	var userProps sql.NullString
	var subID sql.NullInt64

	err := row.Scan(
		&s.ID, &s.Topic, &s.QoS, &s.Disabled, &alias, &s.Retain,
		&s.NL, &s.RAP, &s.RH, &subID, &userProps, &color,
		&s.CreatedAt, &s.ConnectionID,
	)
	if err != nil {
		return nil, fmt.Errorf("scan subscription: %w", err)
	}

	s.Alias = alias.String
	s.Color = color.String
	if subID.Valid {
		v := int(subID.Int64)
		s.SubscriptionIdentifier = &v
	}
	s.UserProperties = models.UnmarshalUserProperties([]byte(userProps.String))

	return &s, nil
}

func scanSubscriptionRows(rows *sql.Rows) (*models.Subscription, error) {
	var s models.Subscription
	var alias, color sql.NullString
	var userProps sql.NullString
	var subID sql.NullInt64

	err := rows.Scan(
		&s.ID, &s.Topic, &s.QoS, &s.Disabled, &alias, &s.Retain,
		&s.NL, &s.RAP, &s.RH, &subID, &userProps, &color,
		&s.CreatedAt, &s.ConnectionID,
	)
	if err != nil {
		return nil, fmt.Errorf("scan subscription: %w", err)
	}

	s.Alias = alias.String
	s.Color = color.String
	if subID.Valid {
		v := int(subID.Int64)
		s.SubscriptionIdentifier = &v
	}
	s.UserProperties = models.UnmarshalUserProperties([]byte(userProps.String))

	return &s, nil
}

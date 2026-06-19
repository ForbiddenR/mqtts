package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/nictoarch/mqtts/internal/models"
)

const settingsSingletonID = "default"

// SettingsRepo provides get/update operations for the settings singleton.
type SettingsRepo struct {
	db *sql.DB
}

// Get retrieves the settings row, creating defaults if none exist.
func (r *SettingsRepo) Get(ctx context.Context) (*models.Settings, error) {
	s, err := r.get(ctx)
	if errors.Is(err, sql.ErrNoRows) {
		defaults := models.DefaultSettings()
		defaults.ID = settingsSingletonID
		if err := r.create(ctx, &defaults); err != nil {
			return nil, fmt.Errorf("create default settings: %w", err)
		}
		return &defaults, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get settings: %w", err)
	}
	return s, nil
}

// Update persists settings changes.
func (r *SettingsRepo) Update(ctx context.Context, s *models.Settings) error {
	templatesJSON, err := json.Marshal(s.PayloadTemplates)
	if err != nil {
		return fmt.Errorf("marshal templates: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE settings SET
			width = ?, height = ?, auto_check = ?, current_lang = ?, current_theme = ?,
			max_reconnect_times = ?, auto_resub = ?, sync_os_theme = ?, multi_topics = ?,
			json_highlight = ?, enable_copilot = ?, open_ai_api_host = ?, open_ai_api_key = ?,
			model = ?, log_level = ?, ignore_qos0_message = ?, payload_templates = ?,
			last_connection_id = ?
		WHERE id = ?`,
		s.Width, s.Height, boolToInt(s.AutoCheck), s.CurrentLang, s.CurrentTheme,
		s.MaxReconnectTimes, boolToInt(s.AutoResub), boolToInt(s.SyncOSTheme), boolToInt(s.MultiTopics),
		boolToInt(s.JSONHighlight), boolToInt(s.EnableCopilot), s.OpenAIAPIHost, s.OpenAIAPIKey,
		s.Model, s.LogLevel, boolToInt(s.IgnoreQoS0Message), string(templatesJSON),
		s.LastConnectionID,
		settingsSingletonID,
	)
	if err != nil {
		return fmt.Errorf("update settings: %w", err)
	}
	return nil
}

func (r *SettingsRepo) get(ctx context.Context) (*models.Settings, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, width, height, auto_check, current_lang, current_theme,
			max_reconnect_times, auto_resub, sync_os_theme, multi_topics,
			json_highlight, enable_copilot, open_ai_api_host, open_ai_api_key,
			model, log_level, ignore_qos0_message, payload_templates, last_connection_id
		FROM settings WHERE id = ?
	`, settingsSingletonID)
	return scanSettings(row)
}

func (r *SettingsRepo) create(ctx context.Context, s *models.Settings) error {
	templatesJSON, err := json.Marshal(s.PayloadTemplates)
	if err != nil {
		return fmt.Errorf("marshal templates: %w", err)
	}

	_, err = r.db.ExecContext(ctx, `
		INSERT INTO settings (
			id, width, height, auto_check, current_lang, current_theme,
			max_reconnect_times, auto_resub, sync_os_theme, multi_topics,
			json_highlight, enable_copilot, open_ai_api_host, open_ai_api_key,
			model, log_level, ignore_qos0_message, payload_templates, last_connection_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		s.ID, s.Width, s.Height, boolToInt(s.AutoCheck), s.CurrentLang, s.CurrentTheme,
		s.MaxReconnectTimes, boolToInt(s.AutoResub), boolToInt(s.SyncOSTheme), boolToInt(s.MultiTopics),
		boolToInt(s.JSONHighlight), boolToInt(s.EnableCopilot), s.OpenAIAPIHost, s.OpenAIAPIKey,
		s.Model, s.LogLevel, boolToInt(s.IgnoreQoS0Message), string(templatesJSON),
		s.LastConnectionID,
	)
	return err
}

func scanSettings(row *sql.Row) (*models.Settings, error) {
	var s models.Settings
	var templatesJSON string
	err := row.Scan(
		&s.ID, &s.Width, &s.Height, &s.AutoCheck, &s.CurrentLang, &s.CurrentTheme,
		&s.MaxReconnectTimes, &s.AutoResub, &s.SyncOSTheme, &s.MultiTopics,
		&s.JSONHighlight, &s.EnableCopilot, &s.OpenAIAPIHost, &s.OpenAIAPIKey,
		&s.Model, &s.LogLevel, &s.IgnoreQoS0Message, &templatesJSON, &s.LastConnectionID,
	)
	if err != nil {
		return nil, fmt.Errorf("scan settings: %w", err)
	}
	if templatesJSON != "" && templatesJSON != "null" {
		_ = json.Unmarshal([]byte(templatesJSON), &s.PayloadTemplates)
	}
	return &s, nil
}

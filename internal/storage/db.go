package storage

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

// DB wraps a SQLite database connection with migration support.
type DB struct {
	*sql.DB
	dbPath string
}

// Open opens a SQLite database at the given path.
// Use ":memory:" for an in-memory database (useful for tests).
func Open(dbPath string) (*DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	// Enable foreign keys and WAL mode for better concurrency.
	pragmas := []string{
		"PRAGMA foreign_keys = ON",
		"PRAGMA journal_mode = WAL",
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			db.Close()
			return nil, fmt.Errorf("set pragma %q: %w", p, err)
		}
	}

	return &DB{DB: db, dbPath: dbPath}, nil
}

// Migrate runs all pending database migrations.
func (db *DB) Migrate() error {
	if err := ensureMigrationsTable(db.DB); err != nil {
		return fmt.Errorf("ensure migrations table: %w", err)
	}

	applied, err := appliedMigrations(db.DB)
	if err != nil {
		return fmt.Errorf("list applied migrations: %w", err)
	}

	for i, m := range migrations {
		if applied[i] {
			continue
		}
		tx, err := db.DB.Begin()
		if err != nil {
			return fmt.Errorf("begin migration %d: %w", i, err)
		}
		if _, err := tx.Exec(m.sql); err != nil {
			tx.Rollback()
			return fmt.Errorf("execute migration %d: %w", i, err)
		}
		if _, err := tx.Exec("INSERT INTO migrations (version) VALUES (?)", i); err != nil {
			tx.Rollback()
			return fmt.Errorf("record migration %d: %w", i, err)
		}
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit migration %d: %w", i, err)
		}
	}
	return nil
}

func ensureMigrationsTable(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS migrations (
			version INTEGER PRIMARY KEY,
			applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	return err
}

func appliedMigrations(db *sql.DB) (map[int]bool, error) {
	rows, err := db.Query("SELECT version FROM migrations")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[int]bool)
	for rows.Next() {
		var v int
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		applied[v] = true
	}
	return applied, rows.Err()
}

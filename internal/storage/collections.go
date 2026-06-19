package storage

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/nictoarch/mqtts/internal/models"
)

// CollectionRepo provides CRUD operations for connection groups/folders.
type CollectionRepo struct {
	db *sql.DB
}

func (r *CollectionRepo) Create(ctx context.Context, c *models.Collection) error {
	if c.ID == "" {
		c.ID = newUUID()
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO collections (id, name, order_id, is_collection, parent_id)
		VALUES (?, ?, ?, ?, ?)`,
		c.ID, c.Name, c.OrderID, boolToInt(c.IsCollection), nullString(c.ParentID),
	)
	if err != nil {
		return fmt.Errorf("insert collection: %w", err)
	}
	return nil
}

func (r *CollectionRepo) Get(ctx context.Context, id string) (*models.Collection, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, order_id, is_collection, parent_id
		FROM collections WHERE id = ?
	`, id)
	return scanCollection(row)
}

func (r *CollectionRepo) List(ctx context.Context) ([]models.Collection, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, order_id, is_collection, parent_id
		FROM collections ORDER BY order_id, name
	`)
	if err != nil {
		return nil, fmt.Errorf("list collections: %w", err)
	}
	defer rows.Close()

	var colls []models.Collection
	for rows.Next() {
		c, err := scanCollectionRows(rows)
		if err != nil {
			return nil, err
		}
		colls = append(colls, *c)
	}
	return colls, rows.Err()
}

func (r *CollectionRepo) Update(ctx context.Context, c *models.Collection) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE collections SET name = ?, order_id = ?, parent_id = ?
		WHERE id = ?`,
		c.Name, c.OrderID, nullString(c.ParentID), c.ID,
	)
	if err != nil {
		return fmt.Errorf("update collection: %w", err)
	}
	return nil
}

func (r *CollectionRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM collections WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("delete collection: %w", err)
	}
	return nil
}

func scanCollection(row *sql.Row) (*models.Collection, error) {
	var c models.Collection
	var parentID sql.NullString
	err := row.Scan(&c.ID, &c.Name, &c.OrderID, &c.IsCollection, &parentID)
	if err != nil {
		return nil, fmt.Errorf("scan collection: %w", err)
	}
	c.ParentID = parentID.String
	return &c, nil
}

func scanCollectionRows(rows *sql.Rows) (*models.Collection, error) {
	var c models.Collection
	var parentID sql.NullString
	err := rows.Scan(&c.ID, &c.Name, &c.OrderID, &c.IsCollection, &parentID)
	if err != nil {
		return nil, fmt.Errorf("scan collection: %w", err)
	}
	c.ParentID = parentID.String
	return &c, nil
}

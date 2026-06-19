package models

// Collection represents a connection folder/group node.
type Collection struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	OrderID      int    `json:"order_id"`
	IsCollection bool   `json:"is_collection"`
	ParentID     string `json:"parent_id,omitempty"`
}

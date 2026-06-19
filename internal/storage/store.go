package storage

// Store composes all repositories for the application.
type Store struct {
	db              *DB
	Connections     *ConnectionRepo
	Messages        *MessageRepo
	Subscriptions   *SubscriptionRepo
	Wills           *WillRepo
	Collections     *CollectionRepo
	Settings        *SettingsRepo
	PublishHistory  *PublishHistoryRepo
}

// NewStore creates a Store from an open, migrated database.
func NewStore(db *DB) *Store {
	return &Store{
		db:              db,
		Connections:     &ConnectionRepo{db: db.DB},
		Messages:        &MessageRepo{db: db.DB},
		Subscriptions:   &SubscriptionRepo{db: db.DB},
		Wills:           &WillRepo{db: db.DB},
		Collections:     &CollectionRepo{db: db.DB},
		Settings:        &SettingsRepo{db: db.DB},
		PublishHistory:  &PublishHistoryRepo{db: db.DB},
	}
}

// Close closes the underlying database connection.
func (s *Store) Close() error {
	return s.db.Close()
}

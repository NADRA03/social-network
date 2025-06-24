package sqlite

import (
	"database/sql"
	"fmt"
	"log"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB(dbPath string, migrationPath string) {
	var err error
	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Database connection error: %v", err)
	}

	dbURI := "sqlite3:///" + filepath.ToSlash(dbPath)
	if err := runMigrations(migrationPath, dbURI); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
}

// runMigrations applies database migrations from the given path.
func runMigrations(migrationPath string, dbURI string) error {
	m, err := migrate.New(
		migrationPath,
		dbURI, // use the full db URI as-is
	)
	if err != nil {
		return fmt.Errorf("migration setup failed: %w", err)
	}

	if err := m.Up(); err != nil && err.Error() != "no change" {
		return fmt.Errorf("migration failed: %w", err)
	}

	return nil
}

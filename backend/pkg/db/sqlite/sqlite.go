package sqlite

import (
    "database/sql"
    "fmt"
    "log"
    "path/filepath"

    _ "github.com/mattn/go-sqlite3"
    "github.com/golang-migrate/migrate/v4"
    _ "github.com/golang-migrate/migrate/v4/database/sqlite3"
    _ "github.com/golang-migrate/migrate/v4/source/file"
)

// InitDB initializes the SQLite database and runs migrations.
func InitDB(dbPath string, migrationPath string) *sql.DB {
    db, err := sql.Open("sqlite3", dbPath)
    if err != nil {
        log.Fatalf("Database connection error: %v", err)
    }

    // Format correctly for golang-migrate
    dbURI := "sqlite3:///" + filepath.ToSlash(dbPath)

    if err := runMigrations(migrationPath, dbURI); err != nil {
        log.Fatalf("Migration failed: %v", err)
    }

    return db
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


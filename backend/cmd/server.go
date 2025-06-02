package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"social-network/pkg/db/sqlite"
)

func main() {
	// Get absolute path to the migrations directory
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal("Failed to get working directory:", err)
	}

	migrationDir := filepath.Join(cwd, "..", "pkg", "db", "migrations", "sqlMigrations")
	migrationPath := "file://" + filepath.ToSlash(migrationDir)

	dbPath := filepath.Join(cwd, "..", "social.db")

	db := sqlite.InitDB(dbPath, migrationPath)
	defer db.Close()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("API is running"))
	})

	log.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

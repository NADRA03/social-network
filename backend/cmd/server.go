package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"

	"github.com/gorilla/mux"
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

	r := mux.NewRouter()

	// Basic health check route
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("API is running"))
	})

	// Auth routes
	r.Handle("/register", auth.RegisterHandler(db)).Methods("POST")
	r.Handle("/login", auth.LoginHandler(db, auth.Store)).Methods("POST")
	// r.Handle("/profile", auth.AuthMiddleware(auth.Store, profileHandler(db))).Methods("GET")

	// Apply CORS middleware
	handler := enableCORS(r)

	log.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// CORS Middleware
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // your frontend origin
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

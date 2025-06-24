package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"social-network/pkg/profile"

	// "social-network/pkg/profile"

	"github.com/gorilla/mux"
)

func main() {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal("Failed to get working directory:", err)
	}

	migrationDir := filepath.Join(cwd, "..", "pkg", "db", "migrations", "sqlMigrations")
	migrationPath := "file://" + filepath.ToSlash(migrationDir)

	dbPath := filepath.Join(cwd, "..", "social.db")

	sqlite.InitDB(dbPath, migrationPath)
	defer sqlite.DB.Close()

	r := mux.NewRouter()

	// Basic health check
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("API is running"))
	})

	// Auth routes
	r.Handle("/register", auth.RegisterHandler(sqlite.DB)).Methods("POST")
	r.Handle("/login", auth.LoginHandler(sqlite.DB)).Methods("POST")

	// Profile routes (with auth middleware)
	r.Handle("/profile/me", auth.AuthMiddleware(http.HandlerFunc(profile.GetOwnProfileHandler))).Methods("GET")
	r.HandleFunc("/users/{id}", profile.GetUserProfileHandler).Methods("GET")
	// r.Handle("/profile/privacy", auth.AuthMiddleware(auth.Store, profile.TogglePrivacyHandler(db))).Methods("PATCH")
	r.Handle("/follow/{id}", auth.AuthMiddleware(profile.FollowHandler(sqlite.DB))).Methods("POST")
	r.Handle("/unfollow/{id}", auth.AuthMiddleware(profile.UnfollowHandler(sqlite.DB))).Methods("DELETE")
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

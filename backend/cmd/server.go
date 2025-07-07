package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"social-network/pkg/posts"
	"social-network/pkg/profile"

	// "social-network/pkg/profile"

	"github.com/gorilla/mux"
)

func main() {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal("Failed to get working directory:", err)
	}

	migrationDir := filepath.Join(cwd, "..", "pkg", "db", "migrations")
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

	// Profile routes
	r.Handle("/profile/{username}", auth.AuthMiddleware(http.HandlerFunc(profile.GetOwnProfileHandler))).Methods("GET")
	r.HandleFunc("/users/{username}", profile.GetUserProfileHandler).Methods("GET")
	r.Handle("/profile/privacy", auth.AuthMiddleware(http.HandlerFunc(profile.TogglePrivacyHandler(sqlite.DB)))).Methods("PATCH")
	r.Handle("/follow/{username}", auth.AuthMiddleware(profile.FollowHandler(sqlite.DB))).Methods("POST")
	r.Handle("/unfollow/{username}", auth.AuthMiddleware(profile.UnfollowHandler(sqlite.DB))).Methods("DELETE")
	// Post routes
	r.Handle("/post", auth.AuthMiddleware(http.HandlerFunc(posts.CreatePostHandler))).Methods("POST")
	r.Handle("/feed", auth.AuthMiddleware(http.HandlerFunc(posts.FeedHandler))).Methods("GET")
	r.Handle("/comment", auth.AuthMiddleware(http.HandlerFunc(posts.CreateCommentHandler))).Methods("POST")
	r.Handle("/comments", auth.AuthMiddleware(http.HandlerFunc(posts.GetCommentsHandler))).Methods("GET")

	// Apply CORS middleware
	handler := enableCORS(r)

	log.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// CORS Middleware
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

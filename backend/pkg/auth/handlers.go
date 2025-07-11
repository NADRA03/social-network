package auth

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"social-network/pkg/db/sqlite"

	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Username string `json:"nickname"`
	Avatar   string `json:"avatar"`
	Bio      string `json:"about_me"`
}

func RegisterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			log.Println("JSON decode error:", err)
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Error hashing password", http.StatusInternalServerError)
			log.Println("Bcrypt error:", err)
			return
		}

		result, err := db.Exec(`
			INSERT INTO users (username, email, password_hash, bio, avatar_url)
			VALUES (?, ?, ?, ?, ?)`,
			req.Username, req.Email, string(hashed), req.Bio, req.Avatar)
		if err != nil {
			http.Error(w, "Registration failed", http.StatusInternalServerError)
			log.Println("DB insert error:", err)
			return
		}

		userID, err := result.LastInsertId()
		if err != nil {
			http.Error(w, "Failed to retrieve user ID", http.StatusInternalServerError)
			log.Println("LastInsertId error:", err)
			return
		}

		createSession(w, int(userID))

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("Registered successfully"))
	}
}


type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		var id int
		var hashed string
		err := db.QueryRow("SELECT id, password_hash FROM users WHERE email = ?", req.Email).Scan(&id, &hashed)
		if err != nil || bcrypt.CompareHashAndPassword([]byte(hashed), []byte(req.Password)) != nil {
			http.Error(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}

		createSession(w, id)

		var username string

		sqlite.DB.QueryRow("SELECT username FROM users WHERE id = ?", id).Scan(&username)
		createSession(w, id) 

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"message":  "Logged in",
			"user_id":  id,
			"username": username,
		})
	}
}

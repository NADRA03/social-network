package auth

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"social-network/pkg/db/sqlite"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	Username  string `json:"nickname"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Avatar    string `json:"avatar"`
	Bio       string `json:"about_me"`
}

func RegisterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			log.Println("JSON decode error:", err)
			return
		}

		if len(req.Username) < 3 || len(req.Username) > 15 {
			http.Error(w, "Username must be between 3 and 15 characters", http.StatusBadRequest)
			return
		}
		if len(req.FirstName) > 15 || len(req.LastName) > 15 {
			http.Error(w, "Name fields must be less than 15 characters", http.StatusBadRequest)
			return
		}
		if len(req.Bio) > 300 {
			http.Error(w, "Bio must be less than 300 characters", http.StatusBadRequest)
			return
		}
		if len(req.Avatar) > 2048 {
			http.Error(w, "Avatar URL is too long", http.StatusBadRequest)
			return
		}

		if !validEmail(req.Email) {
			http.Error(w, "Invalid Email Format", http.StatusBadRequest)
			return
		}

		var exists int
		err := db.QueryRow("SELECT COUNT(1) FROM users WHERE email = ?", req.Email).Scan(&exists)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			log.Println("Email check error:", err)
			return
		}
		if exists > 0 {
			http.Error(w, "Email is already registered", http.StatusConflict)
			return
		}

		if !validPassword(req.Password) {
			http.Error(w, "Password must be at least 8 characters and include a letter and number", http.StatusBadRequest)
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Error hashing password", http.StatusInternalServerError)
			log.Println("Bcrypt error:", err)
			return
		}

		result, err := db.Exec(`
			INSERT INTO users (username, email, first_name, last_name, password_hash, bio, avatar_url)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
			req.Username, req.Email, req.FirstName, req.LastName, string(hashed), req.Bio, req.Avatar)
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

func validPassword(pw string) bool {
	if len(pw) < 8 {
		return false
	}
	hasLetter := false
	hasNumber := false
	for _, c := range pw {
		switch {
		case 'a' <= c && c <= 'z', 'A' <= c && c <= 'Z':
			hasLetter = true
		case '0' <= c && c <= '9':
			hasNumber = true
		}
	}
	return hasLetter && hasNumber
}


func validEmail(email string) bool {
	email_pattern := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return email_pattern.MatchString(email)
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

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err != nil {
		http.Error(w, "no active session found", http.StatusBadRequest)
		return
	}

	_, err = sqlite.DB.Exec("DELETE FROM sessions WHERE id = ?", cookie.Value)
	if err != nil {
		log.Println("Failed to delete session:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	Session = SessionStr{}

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Logged out successfully",
	})
}

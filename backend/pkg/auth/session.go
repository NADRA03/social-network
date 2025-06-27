package auth

import (
	"errors"
	"log"
	"net/http"
	"time"
	"github.com/google/uuid"
	"social-network/pkg/db/sqlite"
	"encoding/json"

)

type SessionStr struct {
	SessionID string
	UserID    int
	Username  string
	Email     string
	Bio       string
	AvatarURL string
	IsPrivate bool
}

var Session SessionStr

func createSession(w http.ResponseWriter, userID int) {
	sessionID := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour)

	_, err := sqlite.DB.Exec(`
		INSERT INTO sessions (id, user_id, expires_at)
		VALUES (?, ?, ?)`, sessionID, userID, expiresAt)
	if err != nil {
		log.Println("Failed to create session:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var s SessionStr
	err = sqlite.DB.QueryRow(`
		SELECT id, username, email, bio, avatar_url, is_private
		FROM users WHERE id = ?`, userID).Scan(
		&s.UserID, &s.Username, &s.Email, &s.Bio, &s.AvatarURL, &s.IsPrivate)
	if err != nil {
		log.Println("Failed to fetch user for session:", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	s.SessionID = sessionID
	Session = s 

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Expires:  expiresAt,
	})
}


func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, err := GetUserIDFromSession(r)
		if err != nil {
			log.Println("AUTH MIDDLEWARE BLOCKED: ", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func GetUserIDFromSession(r *http.Request) (int, error) {
	cookie, err := r.Cookie("session")
	if err != nil {
		return 0, errors.New("missing session cookie")
	}

	var userID int
	var expiresAt time.Time
	err = sqlite.DB.QueryRow(`
		SELECT user_id, expires_at FROM sessions WHERE id = ?`,
		cookie.Value).Scan(&userID, &expiresAt)

	if err != nil {
		return 0, errors.New("invalid session")
	}

	if time.Now().After(expiresAt) {
		return 0, errors.New("session expired")
	}

	var s SessionStr
	err = sqlite.DB.QueryRow(`
		SELECT id, username, email, bio, avatar_url, is_private
		FROM users WHERE id = ?`, userID).Scan(
		&s.UserID, &s.Username, &s.Email, &s.Bio, &s.AvatarURL, &s.IsPrivate)
	if err != nil {
        return 0, errors.New("invalid session")
	}

	s.SessionID = cookie.Value
	Session = s 

	return userID, nil
}

func GetSession(r *http.Request) (SessionStr, error) {
	cookie, err := r.Cookie("session")
	if err != nil {
		return SessionStr{}, errors.New("missing session cookie")
	}

	if cookie.Value != Session.SessionID {
		return SessionStr{}, errors.New("session ID mismatch")
	}

	var s SessionStr
	var expiresAt time.Time
	err = sqlite.DB.QueryRow(`
		SELECT s.id, u.id, u.username, u.email, u.bio, u.avatar_url, u.is_private, s.expires_at
		FROM sessions s
		JOIN users u ON s.user_id = u.id
		WHERE s.id = ?`, cookie.Value).Scan(
		&s.SessionID, &s.UserID, &s.Username, &s.Email, &s.Bio, &s.AvatarURL, &s.IsPrivate, &expiresAt)

	if err != nil {
		return SessionStr{}, errors.New("invalid or expired session")
	}

	if time.Now().After(expiresAt) {
		return SessionStr{}, errors.New("session expired")
	}

	return s, nil
}

func GetSessionHandler(w http.ResponseWriter, r *http.Request) {
	s, err := GetSession(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(s)
}
package auth

import (
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

var sessions = make(map[string]int) // sessionID -> userID map

func createSession(w http.ResponseWriter, userID int) {
	sessionID := uuid.New().String()
	sessions[sessionID] = userID

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		Expires:  time.Now().Add(24 * time.Hour),
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
		return 0, errors.New("unauthorized")
	}

	userID, ok := sessions[cookie.Value]
	if !ok {
		return 0, errors.New("invalid session")
	}

	return userID, nil
}

package profile

import (
	"database/sql"
	"net/http"
	"social-network/pkg/auth"
)

func TogglePrivacyHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := auth.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		_, err = db.Exec(`UPDATE users SET is_private = NOT is_private WHERE id = ?`, userID)
		if err != nil {
			http.Error(w, "Failed to toggle privacy", http.StatusInternalServerError)
			return
		}

		w.Write([]byte("Privacy toggled"))
	}
}


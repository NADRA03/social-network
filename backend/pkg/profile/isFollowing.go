package profile

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/auth"

	"github.com/gorilla/mux"
)

func IsFollowingHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		followerID, err := auth.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		vars := mux.Vars(r)
		id := vars["id"]
		var followedID int
		err = db.QueryRow("SELECT id FROM users WHERE id = ?", id).Scan(&followedID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		var exists bool
		err = db.QueryRow(`
            SELECT EXISTS(
                SELECT 1 FROM followers 
                WHERE follower_id = ? AND followed_id = ?
            )`, followerID, followedID).Scan(&exists)

		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]bool{"isFollowing": exists})
	}
}

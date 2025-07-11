package profile

import (
	"encoding/json"
	"log"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
)

func GetNotFollowedUsersHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := sqlite.DB.Query(`
        SELECT u.id, u.username, u.avatar_url 
        FROM users u
        WHERE u.id != ? AND u.id NOT IN (
            SELECT followed_id FROM followers WHERE follower_id = ?
        )
        LIMIT 5
    `, userID, userID)

	if err != nil {
		log.Printf("Database error: %v", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id int
		var username, avatar string
		if err := rows.Scan(&id, &username, &avatar); err != nil {
			continue
		}
		users = append(users, map[string]interface{}{
			"id":       id,
			"username": username,
			"avatar":   avatar,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

package profile

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
)

func GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := sqlite.DB.Query(`
        SELECT 
            u.id, 
            u.username,
            u.first_name,
            u.last_name,
            u.email, 
            u.avatar_url,
            EXISTS(
                SELECT 1 FROM close_friends cf 
                WHERE cf.user_id = ? AND cf.friend_id = u.id
            ) AS is_close_friend
        FROM followers f 
        JOIN users u ON f.follower_id = u.id 
        WHERE f.followed_id = ?`, userID, userID)
	if err != nil {
		http.Error(w, "Failed to fetch followers: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var followers []map[string]interface{}
	for rows.Next() {
		var id int
		var username sql.NullString
		var firstName, lastName, email, avatar string
		var isCloseFriend bool

		err := rows.Scan(&id, &username, &firstName, &lastName, &email, &avatar, &isCloseFriend)
		if err != nil {
			http.Error(w, "Scanning failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		displayIdentifier := firstName + " " + lastName
		if username.Valid {
			displayIdentifier = username.String
		}

		followers = append(followers, map[string]interface{}{
			"id":                 id,
			"username":           username.String,
			"first_name":         firstName,
			"last_name":          lastName,
			"email":              email,
			"display_identifier": displayIdentifier,
			"avatar":             avatar,
			"is_close_friend":    isCloseFriend,
		})
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error processing rows: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(followers); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func CloseFriendsHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		FriendIDs []int `json:"friend_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "invalid input", http.StatusBadRequest)
		return
	}

	tx, err := sqlite.DB.Begin()
	if err != nil {
		http.Error(w, "Transaction Error", http.StatusInternalServerError)
		return
	}

	if _, err := tx.Exec(`DELETE FROM close_friends WHERE user_id = ?`, userID); err != nil {
		tx.Rollback()
		http.Error(w, "Deletion Failed", http.StatusInternalServerError)
		return
	}

	if len(input.FriendIDs) > 0 {
		for _, fid := range input.FriendIDs {
			if _, err := tx.Exec(`INSERT INTO close_friends (user_id, friend_id) VALUES (?, ?)`, userID, fid); err != nil {
				tx.Rollback()
				http.Error(w, "Insert Failed", http.StatusInternalServerError)
				return
			}
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, "Commit Failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Close friends updated successfully",
	})
}

func GetCloseFriendsHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := sqlite.DB.Query(`
        SELECT 
            u.id,
            u.username,
            u.first_name,
            u.last_name,
            u.avatar_url
        FROM close_friends cf
        JOIN users u ON cf.friend_id = u.id
        WHERE cf.user_id = ?`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch close friends: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var closeFriends []map[string]interface{}
	for rows.Next() {
		var id int
		var username sql.NullString
		var firstName, lastName, avatar string

		err := rows.Scan(&id, &username, &firstName, &lastName, &avatar)
		if err != nil {
			http.Error(w, "Scanning failed: "+err.Error(), http.StatusInternalServerError)
			return
		}

		displayIdentifier := firstName + " " + lastName
		if username.Valid {
			displayIdentifier = username.String
		}

		closeFriends = append(closeFriends, map[string]interface{}{
			"id":                 id,
			"username":           username.String,
			"first_name":         firstName,
			"last_name":          lastName,
			"display_identifier": displayIdentifier,
			"avatar":             avatar,
		})
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error processing rows: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(closeFriends); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

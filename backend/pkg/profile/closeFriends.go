package profile

import (
	"encoding/json"
	"log"
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

	rows, err := sqlite.DB.Query(`SELECT u.id, u.username FROM followers f JOIN users u ON f.follower_id = u.id AND f.followed_id = ?`, userID)
	if err != nil {
		http.Error(w, "Failed to fetch followers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var followers []map[string]interface{}
	for rows.Next() {
		var id int
		var username string
		err := rows.Scan(&id, &username)
		if err != nil {
			http.Error(w, "Scanning failed", http.StatusInternalServerError)
			return
		}
		followers = append(followers, map[string]interface{}{"id": id, "username": username})
	}
	json.NewEncoder(w).Encode(followers)
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
		http.Error(w, "Deletion Failed", http.StatusInternalServerError)
		return
	}

	for _, fid := range input.FriendIDs {
		if _, err := tx.Exec(`INSERT INTO close_friends (user_id, friend_id) VALUES (?, ?)`, userID, fid); err != nil {
			tx.Rollback()
			http.Error(w, "Insert Failed", http.StatusInternalServerError)
			return
		}
	}
	log.Println("Received IDs:", input.FriendIDs)
	tx.Commit()
	w.WriteHeader(http.StatusOK)
}

func GetCloseFriendsHandler(w http.ResponseWriter, r *http.Request) {
    userID, err := auth.GetUserIDFromSession(r)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    rows, err := sqlite.DB.Query(`
        SELECT u.id, u.username 
        FROM close_friends cf 
        JOIN users u ON cf.friend_id = u.id 
        WHERE cf.user_id = ?`, userID)
    if err != nil {
        http.Error(w, "Failed to fetch close friends", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var closeFriends []map[string]interface{}
    for rows.Next() {
        var id int
        var username string
        err := rows.Scan(&id, &username)
        if err != nil {
            http.Error(w, "Scanning failed", http.StatusInternalServerError)
            return
        }
        closeFriends = append(closeFriends, map[string]interface{}{"id": id, "username": username})
    }
    json.NewEncoder(w).Encode(closeFriends)
}
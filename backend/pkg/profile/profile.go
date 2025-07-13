package profile

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"github.com/gorilla/mux"
	"log"
)

func GetOwnProfileHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var username, email, bio, avatar, joinDate string
	var isPrivate bool
	err = sqlite.DB.QueryRow(`
	SELECT username, email, bio, avatar_url, is_private, created_at
	FROM users
	WHERE id = ?`, userID).Scan(&username, &email, &bio, &avatar, &isPrivate, &joinDate)

	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	currentUserID, err := auth.GetUserIDFromSession(r)
	isFollowing := false
	if err != nil {
		err = sqlite.DB.QueryRow(`SELECT 1 FROM followers WHERE follower_id = ? AND followed_id = ?`, currentUserID, userID).Scan(&isFollowing)
		if err != nil {
			isFollowing = true
		}
	}

	var followerCount, followingCount, postCount int
	sqlite.DB.QueryRow(`SELECT COUNT(*) FROM followers WHERE followed_id = ?`, currentUserID).Scan(&followerCount)
	sqlite.DB.QueryRow(`SELECT COUNT(*) FROM followers WHERE follower_id = ?`, currentUserID).Scan(&followingCount)
	sqlite.DB.QueryRow(`SELECT COUNT(*) FROM posts WHERE user_id = ?`, currentUserID).Scan(&postCount)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"username":       username,	
		"email":          email,
		"bio":            bio,
		"avatar":         avatar,
		"is_private":     isPrivate,
		"is_owner":       true,
		"user_id":        userID,
		"joinDate":       joinDate,
		"isFollowing":    false,
		"followerCount":  followerCount,
		"followingCount": followingCount,
		"postCount":      postCount,
	})
}

func FollowHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		followerID, err := auth.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		vars := mux.Vars(r)
		username := vars["username"]
		var followedID int
		var isPrivate bool

		err = sqlite.DB.QueryRow(
			"SELECT id, is_private FROM users WHERE username = ?", username,
		).Scan(&followedID, &isPrivate)

		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if followedID == followerID {
			http.Error(w, "Cannot follow your own account", http.StatusBadRequest)
			return
		}

		if isPrivate {
			// Only send follow request notification, don't insert into followers
			message := "You have a new follow request."

			_, err := sqlite.DB.Exec(`
				INSERT INTO notifications (user_id, inviter_id, type, message, status)
				VALUES (?, ?, ?, ?, ?)`,
				followedID, followerID, "follow_request", message, "unread")

			if err != nil {
				log.Println("Failed to create follow request notification:", err)
			} else if conn, ok := auth.ActiveUsers[followedID]; ok {
				// Live update if online
				rows, err := sqlite.DB.Query(`
					SELECT id, inviter_id, group_id, event_id, type, message, status, created_at, read
					FROM notifications WHERE user_id = ?`, followedID)

				if err == nil {
					var notifs []map[string]interface{}
					for rows.Next() {
						var id, inviterID int
						var groupID, eventID sql.NullInt64
						var notifType, message, status, createdAt string
						var read bool
						if err := rows.Scan(&id, &inviterID, &groupID, &eventID, &notifType, &message, &status, &createdAt, &read); err == nil {
							notif := map[string]interface{}{
								"id": id, "inviter_id": inviterID, "group_id": nil, "event_id": nil,
								"type": notifType, "message": message, "status": status,
								"created_at": createdAt, "read": read,
							}
							if groupID.Valid {
								notif["group_id"] = groupID.Int64
							}
							if eventID.Valid {
								notif["event_id"] = eventID.Int64
							}
							notifs = append(notifs, notif)
						}
					}
					rows.Close()

					conn.WriteJSON(map[string]interface{}{
						"type":          "notifications-list",
						"notifications": notifs,
					})
				}
			}

			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Follow request sent"))
			return
		}

		// Public account: insert directly
		_, err = db.Exec(`
			INSERT OR IGNORE INTO followers (follower_id, followed_id)
			VALUES (?, ?)`, followerID, followedID)

		if err != nil {
			http.Error(w, "Follow failed", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Followed"))
	}
}



func UnfollowHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		followerID, err := auth.GetUserIDFromSession(r)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		vars := mux.Vars(r)
		username := vars["username"]
		var followedID int
		err = sqlite.DB.QueryRow("SELECT id FROM users WHERE username = ?", username).Scan(&followedID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if followedID == followerID {
			http.Error(w, "cannot unfollow your account", http.StatusBadRequest)
		}

		_, err = db.Exec(`DELETE FROM followers WHERE follower_id = ? AND followed_id = ?`, followerID, followedID)
		if err != nil {
			http.Error(w, "Unfollow failed", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Unfollowed"))
	}
}

func UpdateAvatarHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		Avatar string `json:"avatar"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err = sqlite.DB.Exec(`UPDATE users SET avatar_url = ? WHERE id = ?`, input.Avatar, userID)
	if err != nil {
		http.Error(w, "Failed to update avatar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func AcceptFollowRequestHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, err := auth.GetUserIDFromSession(r) 
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var req struct {
			InviterID    int `json:"inviter_id"`    
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		_, err = db.Exec(`INSERT OR IGNORE INTO followers (follower_id, followed_id) VALUES (?, ?)`, req.InviterID, userID)
		if err != nil {
			http.Error(w, "Failed to accept follow request", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Follow request accepted"))
	}
}


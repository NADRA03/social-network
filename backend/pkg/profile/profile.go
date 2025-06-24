package profile

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"strconv"

	"github.com/gorilla/mux"
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
	sqlite.DB.QueryRow(`SELECT COUNT(*) FROM followers WHERE follower_id = ?`, currentUserID).Scan(&followerCount)
	sqlite.DB.QueryRow(`SELECT COUNT(*) FROM followers WHERE followed_id = ?`, currentUserID).Scan(&followingCount)
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
		followedID, err := strconv.Atoi(vars["id"])
		if err != nil || followedID == followerID {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}

		_, err = db.Exec(`INSERT OR IGNORE INTO followers (follower_id, followed_id) VALUES (?, ?)`, followerID, followedID)
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
		followedID, err := strconv.Atoi(vars["id"])
		if err != nil || followedID == followerID {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
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

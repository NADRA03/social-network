package profile

import (
	"encoding/json"
	"net/http"

	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"

	"github.com/gorilla/mux"
)

type User struct {
	ID        int
	Username  string
	Email     string
	Bio       string
	Avatar    string
	IsPrivate bool
	JoinDate  string
}

// GET /users/{id} - returns a public user profile
func GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	if username == "" {
		http.Error(w, "Invalid username", http.StatusBadRequest)
		return
	}
	// Try to get requester (viewer) from session
	requesterID, _ := auth.GetUserIDFromSession(r)

	user, err := getUserByUsername(username)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	isOwner := requesterID == user.ID
	canView := !user.IsPrivate || isOwner

	var followerCount, followingCount, postCount int
	sqlite.DB.QueryRow(`SELECT COUNT(*) FROM followers WHERE followed_id = ?`, user.ID).Scan(&followerCount)
	sqlite.DB.QueryRow(`SELECT COUNT(*) FROM followers WHERE follower_id = ?`, user.ID).Scan(&followingCount)
	sqlite.DB.QueryRow(`SELECT COUNT(*) FROM posts WHERE user_id = ?`, user.ID).Scan(&postCount)

	response := map[string]interface{}{
		"username":         user.Username,
		"email":            user.Email,
		"bio":              user.Bio,
		"avatar":           user.Avatar,
		"joinDate":         user.JoinDate,
		"is_owner":         isOwner,
		"user_id":          user.ID,
		"is_following":     false,
		"can_view_content": true,
		"is_private":       user.IsPrivate,
		"follower_count":   followerCount,
		"following_count":  followingCount,
		"post_count":       postCount,
	}

	isFollowing := false;

	if !isOwner {
		var count int
		err := sqlite.DB.QueryRow(`
			SELECT COUNT(*) FROM followers
			WHERE followed_id = ? AND follower_id = ?
		`, user.ID, requesterID).Scan(&count)

		if err != nil && count > 0 {
			isFollowing = true
		}

		canView = !user.IsPrivate || isFollowing
	}

	response["is_following"] = isFollowing
	response["can_view_content"] = canView || isOwner

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// getUserByID fetches user info from the database
func getUserByUsername(username string) (*User, error) {
	row := sqlite.DB.QueryRow(`
		SELECT id, username, email, bio, avatar_url, is_private, created_at
		FROM users
		WHERE username = ?
	`, username)

	var u User
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Bio, &u.Avatar, &u.IsPrivate, &u.JoinDate)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

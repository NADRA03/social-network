package profile

import (
	"encoding/json"
	"net/http"

	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"

	"github.com/gorilla/mux"
)

type User struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Bio       string `json:"bio"`
	Avatar    string `json:"avatar"`
	IsPrivate bool   `json:"is_private"`
	JoinDate  string `json:"joinDate"`
}

func GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	if id == "" {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}
	requesterID, _ := auth.GetUserIDFromSession(r)

	var user User

	err := sqlite.DB.QueryRow(`
        SELECT id, username, first_name, last_name, email, bio, avatar_url, is_private, created_at
        FROM users
        WHERE id = ?
    `, id).Scan(
		&user.ID, &user.Username, &user.FirstName, &user.LastName,
		&user.Email, &user.Bio, &user.Avatar, &user.IsPrivate, &user.JoinDate)

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
		"id":               user.ID,
		"username":         user.Username,
		"first_name":       user.FirstName,
		"last_name":        user.LastName,
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

	isFollowing := false

	if !isOwner {
		var count int
		err := sqlite.DB.QueryRow(`
            SELECT COUNT(*) FROM followers
            WHERE followed_id = ? AND follower_id = ?
        `, user.ID, requesterID).Scan(&count)

		if err == nil && count > 0 {
			isFollowing = true
		}

		canView = !user.IsPrivate || isFollowing
	}

	response["is_following"] = isFollowing
	response["can_view_content"] = canView || isOwner

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func getUserByID(id string) (*User, error) {
	row := sqlite.DB.QueryRow(`
        SELECT id, username, first_name, last_name, email, bio, avatar_url, is_private, created_at
        FROM users
        WHERE id = ?
    `, id)

	var u User
	err := row.Scan(&u.ID, &u.Username, &u.FirstName, &u.LastName, &u.Email, &u.Bio, &u.Avatar, &u.IsPrivate, &u.JoinDate)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

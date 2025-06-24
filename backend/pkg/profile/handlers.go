package profile

import (
	"encoding/json"
	"net/http"
	"strconv"

	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"

	"github.com/gorilla/mux"
)

// User represents a user profile.
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
	targetID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Try to get requester (viewer) from session
	requesterID, _ := auth.GetUserIDFromSession(r)

	user, err := getUserByID(targetID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// If private, block unless viewer is same user or accepted follower
	if user.IsPrivate && requesterID != targetID {
		var count int
		err := sqlite.DB.QueryRow(`
			SELECT COUNT(*) FROM followers
			WHERE followed_id = ? AND follower_id = ? AND accepted = 1
		`, targetID, requesterID).Scan(&count)
		if err != nil || count == 0 {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
	}

	// Determine ownership
	isOwner := requesterID == targetID

	response := map[string]interface{}{
		"username":     user.Username,
		"email":        user.Email,
		"bio":          user.Bio,
		"avatar":       user.Avatar,
		"joinDate":     user.JoinDate,
		"is_owner":     isOwner,
		"user_id":      user.ID,
		"is_following": false, // You can add logic to check this
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// getUserByID fetches user info from the database
func getUserByID(id int) (*User, error) {
	row := sqlite.DB.QueryRow(`
		SELECT id, username, email, bio, avatar_url, is_private, created_at
		FROM users
		WHERE id = ?
	`, id)

	var u User
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.Bio, &u.Avatar, &u.IsPrivate, &u.JoinDate)
	if err != nil {
		return nil, err
	}
	return &u, nil

}

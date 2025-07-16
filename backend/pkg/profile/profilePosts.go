package profile

import (
	"encoding/json"
	"log"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"

	"github.com/gorilla/mux"
)

func GetUserPostsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userId := vars["id"]

	requesterID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := getUserByID(userId)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	isOwner := requesterID == user.ID
	isFollowing := false
	isCloseFriend := false

	if !isOwner {
		var count int
		err := sqlite.DB.QueryRow(`
			SELECT COUNT(*) FROM followers
			WHERE followed_id = ? AND follower_id = ?
		`, user.ID, requesterID).Scan(&count)
		if err != nil {
			log.Printf("Error checking followers: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		isFollowing = count > 0

		err = sqlite.DB.QueryRow(`
			SELECT COUNT(*) FROM close_friends
			WHERE user_id = ? AND friend_id = ?
		`, user.ID, requesterID).Scan(&count)
		if err != nil {
			log.Printf("Error checking close friends: %v", err)
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		isCloseFriend = count > 0
	}

	canView := !user.IsPrivate || isFollowing || isOwner
	if !canView {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "private",
			"message": "This account is private",
			"posts":   []interface{}{},
		})
		return
	}

	rows, err := sqlite.DB.Query(`
		SELECT 
			p.id, 
			p.user_id, 
			u.first_name, 
			u.last_name, 
			u.avatar_url, 
			p.content, 
			p.image_url, 
			p.created_at, 
			p.visibility
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.user_id = ?
		AND (
			p.visibility = 0 OR  -- Public posts
			(p.visibility = 1 AND (? OR ?)) OR  -- Followers only (if follower or owner)
			(p.visibility = 2 AND (? OR ?))  -- Close friends only (if close friend or owner)
		)
		ORDER BY p.created_at DESC
	`, userId, isFollowing, isOwner, isCloseFriend, isOwner)

	if err != nil {
		log.Printf("Error querying posts: %v", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type Post struct {
		ID         int    `json:"id"`
		UserID     int    `json:"user_id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		AvatarURL  string `json:"avatar_url"`
		Content    string `json:"content"`
		ImageURL   string `json:"image_url"`
		CreatedAt  string `json:"created_at"`
		Visibility int    `json:"visibility"`
	}

	var posts []Post
	for rows.Next() {
		var p Post
		err := rows.Scan(
			&p.ID,
			&p.UserID,
			&p.FirstName,
			&p.LastName,
			&p.AvatarURL,
			&p.Content,
			&p.ImageURL,
			&p.CreatedAt,
			&p.Visibility,
		)
		if err != nil {
			log.Printf("Error scanning post: %v", err)
			continue
		}
		posts = append(posts, p)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error processing posts: %v", err)
		http.Error(w, "Error processing posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"posts":  posts,
	}); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

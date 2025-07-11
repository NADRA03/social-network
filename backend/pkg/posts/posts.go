package posts

import (
	"encoding/json"
	"log"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"time"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		Content    string `json:"content"`
		Image      string `json:"image"`
		Visibility int    `json:"visibility"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err = sqlite.DB.Exec(`INSERT INTO posts (user_id, content, image_url, visibility) VALUES (?, ?, ?, ?)`, userID, input.Content, input.Image, input.Visibility)
	if err != nil {
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func FeedHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := sqlite.DB.Query(`
		SELECT p.id, p.content, p.image_url, u.username, u.avatar_url, p.created_at, p.visibility
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN followers f ON f.followed_id = p.user_id AND f.follower_id = ?
        LEFT JOIN close_friends cf ON cf.user_id = p.user_id AND cf.friend_id = ?
        WHERE (
        -- Public posts
        p.visibility = 0
        -- OR posts visible to followers (if user is follower)
        OR (p.visibility = 1 AND f.follower_id IS NOT NULL)
        -- OR posts visible to close friends (if user is in author's close friends)
        OR (p.visibility = 2 AND cf.friend_id IS NOT NULL)
        -- OR user's own posts
        OR p.user_id = ?
    )
    ORDER BY p.created_at DESC
	`, userID, userID, userID)
	if err != nil {
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []map[string]interface{}
	for rows.Next() {
		var id int
		var content, image, username, avatar string
		var createdAt time.Time
		var visibility int

		if err := rows.Scan(&id, &content, &image, &username, &avatar, &createdAt, &visibility); err != nil {
			log.Printf("Row scan error: %v", err)
			// http.Error(w, "Failed to scan post", http.StatusInternalServerError)
			continue
		}

		createdAtStr := createdAt.Format(time.RFC3339)

		posts = append(posts, map[string]interface{}{
			"id":         id,
			"content":    content,
			"image":      image,
			"username":   username,
			"avatar_url": avatar,
			"created_at": createdAtStr,
			"visibility": visibility,
		})
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

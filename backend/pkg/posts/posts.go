package posts

import (
	"encoding/json"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"time"
	// "time"
)

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		Content string `json:"content"`
		Image   string `json:"image"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err = sqlite.DB.Exec(`INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)`, userID, input.Content, input.Image)
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
		SELECT p.id, p.content, p.image_url, u.username, u.avatar_url, p.created_at
        FROM posts p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN followers f ON f.followed_id = u.id AND f.follower_id = ?
        WHERE u.is_private = 0 OR f.follower_id IS NOT NULL OR u.id = ?
        ORDER BY p.created_at DESC;
	`, userID, userID)
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

		if err := rows.Scan(&id, &content, &image, &username, &avatar, &createdAt); err != nil {
			http.Error(w, "Failed to scan post", http.StatusInternalServerError)
			return
		}

		createdAtStr := createdAt.Format(time.RFC3339)

		posts = append(posts, map[string]interface{}{
			"id":         id,
			"content":    content,
			"image":      image,
			"username":   username,
			"avatar_url": avatar,
			"created_at": createdAtStr,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

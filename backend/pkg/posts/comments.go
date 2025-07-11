package posts

import (
	"encoding/json"
	"net/http"
	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"time"
)

type CreateCommentInput struct {
	PostID  int    `json:"post_id"`
	Content string `json:"content"`
}

func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
	userID, err := auth.GetUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input CreateCommentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if input.Content == "" || input.PostID == 0 {
		http.Error(w, "Missing content or post ID", http.StatusBadRequest)
		return
	}

	_, err = sqlite.DB.Exec(`
		INSERT INTO comments (post_id, user_id, content) 
		VALUES (?, ?, ?)
	`, input.PostID, userID, input.Content)

	if err != nil {
		http.Error(w, "Failed to save comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func GetCommentsHandler(w http.ResponseWriter, r *http.Request) {
	postID := r.URL.Query().Get("post_id")

	rows, err := sqlite.DB.Query(`
		SELECT c.id, c.content, c.created_at, u.username
		FROM comments c
		JOIN users u ON u.id = c.user_id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC;
	`, postID)
	if err != nil {
		http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []map[string]interface{}
	for rows.Next() {
		var id int
		var content, username string
		var createdAt time.Time

		if err := rows.Scan(&id, &content, &createdAt, &username); err != nil {
			http.Error(w, "Failed to scan comment", http.StatusInternalServerError)
			return
		}

		comments = append(comments, map[string]interface{}{
			"id":         id,
			"content":    content,
			"username":   username,
			"created_at": createdAt.Format(time.RFC3339),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comments)
}

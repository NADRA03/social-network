package chat

import (
	"encoding/json"
	"net/http"
	"social-network/pkg/db/sqlite"
	"social-network/pkg/auth"
	"strconv"
)

type GroupPost struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	GroupID   int       `json:"group_id"`
	Content   string    `json:"content"`
	ImageURL  string    `json:"image_url"`
	CreatedAt string    `json:"created_at"`
}

type GroupComment struct {
	ID        int    `json:"id"`
	PostID    int    `json:"post_id"`
	UserID    int    `json:"user_id"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

func CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	var post GroupPost
	if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if !IsUserInGroup(auth.Session.UserID, post.GroupID) {
		http.Error(w, "Forbidden: not a group member", http.StatusForbidden)
		return
	}

	query := `INSERT INTO group_posts (user_id, group_id, content, image_url) VALUES (?, ?, ?, ?)`
	result, err := sqlite.DB.Exec(query, auth.Session.UserID, post.GroupID, post.Content, post.ImageURL)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	lastID, _ := result.LastInsertId()

	row := sqlite.DB.QueryRow(`SELECT id, user_id, group_id, content, image_url, created_at FROM group_posts WHERE id = ?`, lastID)
	err = row.Scan(&post.ID, &post.UserID, &post.GroupID, &post.Content, &post.ImageURL, &post.CreatedAt)
	if err != nil {
		http.Error(w, "Failed to fetch post", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(post)
}


func CreateGroupComment(w http.ResponseWriter, r *http.Request) {
	var comment GroupComment
	if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var groupID int
	err := sqlite.DB.QueryRow(`SELECT group_id FROM group_posts WHERE id = ?`, comment.PostID).Scan(&groupID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if !IsUserInGroup(auth.Session.UserID, groupID) {
		http.Error(w, "Forbidden: not a group member", http.StatusForbidden)
		return
	}

	result, err := sqlite.DB.Exec(
		`INSERT INTO group_comments (post_id, user_id, content) VALUES (?, ?, ?)`,
		comment.PostID, auth.Session.UserID, comment.Content,
	)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	lastID, _ := result.LastInsertId()

	err = sqlite.DB.QueryRow(`
		SELECT id, post_id, user_id, content, created_at
		FROM group_comments
		WHERE id = ?
	`, lastID).Scan(&comment.ID, &comment.PostID, &comment.UserID, &comment.Content, &comment.CreatedAt)
	if err != nil {
		http.Error(w, "Failed to fetch comment", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(comment)
}

func GetGroupPosts(w http.ResponseWriter, r *http.Request) {

	groupIDStr := r.URL.Query().Get("group_id")
	if groupIDStr == "" {
		http.Error(w, "Missing group_id", http.StatusBadRequest)
		return
	}

	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group_id", http.StatusBadRequest)
		return
	}

	if !IsUserInGroup(auth.Session.UserID, groupID) {
		http.Error(w, "Forbidden: not a group member", http.StatusForbidden)
		return
	}

	rows, err := sqlite.DB.Query(`
		SELECT id, user_id, group_id, content, image_url, created_at
		FROM group_posts
		WHERE group_id = ?
		ORDER BY created_at DESC
	`, groupID)
	if err != nil {
		http.Error(w, "Query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []GroupPost
	for rows.Next() {
		var p GroupPost
		if err := rows.Scan(&p.ID, &p.UserID, &p.GroupID, &p.Content, &p.ImageURL, &p.CreatedAt); err != nil {
			continue
		}
		posts = append(posts, p)
	}

	json.NewEncoder(w).Encode(posts)
}

func GetGroupComments(w http.ResponseWriter, r *http.Request) {
	postIDStr := r.URL.Query().Get("post_id")
	if postIDStr == "" {
		http.Error(w, "post_id required", http.StatusBadRequest)
		return
	}

	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post_id", http.StatusBadRequest)
		return
	}

	var groupID int
	err = sqlite.DB.QueryRow(`SELECT group_id FROM group_posts WHERE id = ?`, postID).Scan(&groupID)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	if !IsUserInGroup(auth.Session.UserID, groupID) {
		http.Error(w, "Forbidden: not a group member", http.StatusForbidden)
		return
	}

	rows, err := sqlite.DB.Query(`
		SELECT id, post_id, user_id, content, created_at
		FROM group_comments
		WHERE post_id = ?
		ORDER BY created_at ASC
	`, postID)
	if err != nil {
		http.Error(w, "Query error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []GroupComment
	for rows.Next() {
		var c GroupComment
		if err := rows.Scan(&c.ID, &c.PostID, &c.UserID, &c.Content, &c.CreatedAt); err != nil {
			continue
		}
		comments = append(comments, c)
	}

	json.NewEncoder(w).Encode(comments)
}


func IsUserInGroup(userID, groupID int) bool {
	query := `SELECT 1 FROM group_members WHERE user_id = ? AND group_id = ? LIMIT 1`
	row := sqlite.DB.QueryRow(query, userID, groupID)

	var dummy int
	err := row.Scan(&dummy)
	return err == nil
}

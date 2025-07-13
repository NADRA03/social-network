package profile

import (
	"encoding/json"
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

    if !isOwner {
        var count int
        err := sqlite.DB.QueryRow(`
            SELECT COUNT(*) FROM followers
            WHERE followed_id = ? AND follower_id = ?
        `, user.ID, requesterID).Scan(&count)
        if err != nil {
            http.Error(w, "Database error", http.StatusInternalServerError)
            return
        }
        isFollowing = count > 0
    }

    canView := !user.IsPrivate || isFollowing || isOwner
    if !canView {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]interface{}{
            "status":   "private",
            "message":  "This account is private",
            "posts":    []interface{}{},
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
            p.visibility = 0 OR 
            (p.visibility = 1 AND ?) OR 
            (p.visibility = 2 AND ?)
        )
        ORDER BY p.created_at DESC
    `, userId, isFollowing || isOwner, isOwner)

    if err != nil {
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
            http.Error(w, "Error scanning posts", http.StatusInternalServerError)
            return
        }
        posts = append(posts, p)
    }

    if err = rows.Err(); err != nil {
        http.Error(w, "Error processing posts", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    if err := json.NewEncoder(w).Encode(map[string]interface{}{
        "status":   "success",
        "posts":    posts,
    }); err != nil {
        http.Error(w, "Error encoding response", http.StatusInternalServerError)
    }
}

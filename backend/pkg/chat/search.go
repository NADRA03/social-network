package chat

import (
	"social-network/pkg/db/sqlite"
	"net/http"	
	"encoding/json"
	"social-network/pkg/auth"
	"log"
)
 
func SearchUsers(username string) ([]auth.User, error) {
	query := `
		SELECT id, username, email, bio, avatar_url, created_at, is_private
		FROM users
		WHERE id != ?`

	args := []any{auth.Session.UserID}

	if username != "" {
		query += ` AND username LIKE ?`
		args = append(args, "%"+username+"%")
	}

	rows, err := sqlite.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []auth.User
	for rows.Next() {
		var u auth.User
		err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.Bio, &u.AvatarURL, &u.CreatedAt, &u.IsPrivate)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}

	log.Printf("SearchUsers: found %d user(s) matching '%s'", len(users), username)
	for _, u := range users {
		log.Printf("User: ID=%d, Username=%s, Email=%s", u.ID, u.Username, u.Email)
	}

	return users, nil
}



func SearchUsersHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Username string `json:"username"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	users, err := SearchUsers(payload.Username)
	if err != nil {
		http.Error(w, "Search failed", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(users)
}



func SearchGroups(name string) ([]map[string]interface{}, error) {
	userID := auth.Session.UserID

	query := `
		SELECT g.id, g.name, g.description, g.creator_id, g.created_at,
		EXISTS (
			SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = ?
		) AS is_member
		FROM groups g
		WHERE g.name LIKE ?`

	rows, err := sqlite.DB.Query(query, userID, "%"+name+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []map[string]interface{}
	for rows.Next() {
		var id, creatorID int
		var name, description, createdAt string
		var isMember bool

		if err := rows.Scan(&id, &name, &description, &creatorID, &createdAt, &isMember); err != nil {
			return nil, err
		}

		groups = append(groups, map[string]interface{}{
			"id":          id,
			"name":        name,
			"description": description,
			"creator_id":  creatorID,
			"created_at":  createdAt,
			"is_member":   isMember,
		})
	}

	return groups, nil
}



func SearchGroupsHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	groups, err := SearchGroups(payload.Name)
	if err != nil {
		http.Error(w, "Search failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

package chat

import (
	"social-network/pkg/db/sqlite"
	"net/http"	
	"encoding/json"
	"social-network/pkg/auth"
	"fmt"
	"strconv"
)

func CreateGroup(name, description string, creatorID int) (int64, error) {
	query := `INSERT INTO groups (name, description, creator_id) VALUES (?, ?, ?)`
	result, err := sqlite.DB.Exec(query, name, description, creatorID)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func AddMemberToGroup(groupID, userID int) error {
	query := `INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`
	_, err := sqlite.DB.Exec(query, groupID, userID)
	return err
}

func CreateGroupHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	groupID, err := CreateGroup(payload.Name, payload.Description, auth.Session.UserID)
	if err != nil {
		http.Error(w, "Failed to create group", http.StatusInternalServerError)
		return
	}

	_ = AddMemberToGroup(int(groupID), auth.Session.UserID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"group_id": groupID})
}

func AddGroupMemberHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
	GroupID int `json:"group_id"`
	UserID  int `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var creatorID int
	err := sqlite.DB.QueryRow(`SELECT creator_id FROM groups WHERE id = ?`, payload.GroupID).Scan(&creatorID)
	if err != nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	err = AddMemberToGroup(payload.GroupID, payload.UserID)
	if err != nil {
		http.Error(w, "Failed to add member", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

type GroupWithUsers struct {
	GroupID     int       `json:"group_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatorID   int       `json:"creator_id"`
	CreatedAt   string    `json:"created_at"`
	Members     []auth.User `json:"members"`
}

func GetUsersInGroup(groupID int) (*GroupWithUsers, error) {
	var group GroupWithUsers
	group.GroupID = groupID

	err := sqlite.DB.QueryRow(`
		SELECT name, description, creator_id, created_at
		FROM groups
		WHERE id = ?
	`, groupID).Scan(&group.Name, &group.Description, &group.CreatorID, &group.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to get group info: %v", err)
	}

	query := `
		SELECT u.id, u.username, u.email, u.bio, u.avatar_url, u.created_at, u.is_private
		FROM users u
		INNER JOIN group_members gm ON gm.user_id = u.id
		WHERE gm.group_id = ?
		ORDER BY u.username ASC
	`

	rows, err := sqlite.DB.Query(query, groupID)
	if err != nil {
		return nil, fmt.Errorf("query failed: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var u auth.User
		err := rows.Scan(
			&u.ID, &u.Username, &u.Email, &u.Bio, &u.AvatarURL, &u.CreatedAt, &u.IsPrivate,
		)
		if err != nil {
			return nil, fmt.Errorf("scan failed: %v", err)
		}
		group.Members = append(group.Members, u)
	}

	return &group, nil
}

func GetGroupMembersHandler(w http.ResponseWriter, r *http.Request) {
	userID := auth.Session.UserID

	groupIDStr := r.URL.Query().Get("group_id")
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	var isMember bool
	err = sqlite.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil || !isMember {
		http.Error(w, "Forbidden: Not a group member", http.StatusForbidden)
		return
	}

	users, err := GetUsersInGroup(groupID)
	if err != nil {
		http.Error(w, "Failed to get group members", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

package chat

import (
	"social-network/pkg/db/sqlite"
	"net/http"	
	"encoding/json"
	"strconv"
	"social-network/pkg/auth"
)

type Message struct {
	ID           int    `json:"id"`
	SenderID     int    `json:"sender_id"`
	SenderName   string `json:"sender_name"`
	ReceiverID   int    `json:"receiver_id"`
	ReceiverName string `json:"receiver_name"`
	Content      string `json:"text"`
	CreatedAt    string `json:"created_at"`
}

func GetChatMessages(user1, user2, limit, offset int) ([]Message, error) {
	query := `
		SELECT 
			m.id,
			m.sender_id,
			sender.username AS sender_name,
			m.receiver_id,
			receiver.username AS receiver_name,
			m.content,
			m.created_at
		FROM 
			messages m
		JOIN 
			users sender ON m.sender_id = sender.id
		JOIN 
			users receiver ON m.receiver_id = receiver.id
		WHERE 
			m.group_id IS NULL AND
			((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
		ORDER BY 
			m.created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := sqlite.DB.Query(query, user1, user2, user2, user1, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		err := rows.Scan(
			&msg.ID,
			&msg.SenderID,
			&msg.SenderName,
			&msg.ReceiverID,
			&msg.ReceiverName,
			&msg.Content,
			&msg.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	// Reverse to chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func GetChatMessagesHandler(w http.ResponseWriter, r *http.Request) {
	requesterID := auth.Session.UserID

	user1Str := r.URL.Query().Get("user1")
	user2Str := r.URL.Query().Get("user2")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	user1, err1 := strconv.Atoi(user1Str)
	user2, err2 := strconv.Atoi(user2Str)
	if err1 != nil || err2 != nil {
		http.Error(w, "Invalid user IDs", http.StatusBadRequest)
		return
	}

	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)
	if limit <= 0 {
		limit = 10
	}

	if requesterID != user1 && requesterID != user2 {
		http.Error(w, "Forbidden: You are not part of this chat", http.StatusForbidden)
		return
	}

	messages, err := GetChatMessages(user1, user2, limit, offset)
	if err != nil {
		http.Error(w, "Failed to get messages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

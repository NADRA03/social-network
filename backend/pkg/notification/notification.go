package notification

import (
	"social-network/pkg/db/sqlite"
	"net/http"	
	"encoding/json"
	"social-network/pkg/auth"
	"database/sql"
	"log"
	"fmt"
)


func CreateNotification(userID, inviterID int, groupID, eventID sql.NullInt64, notifType, message, status string) error {
	query := `
		INSERT INTO notifications (user_id, inviter_id, group_id, event_id, type, message, status)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err := sqlite.DB.Exec(query, userID, inviterID, groupID, eventID, notifType, message, status)
	return err
}

func CreateNotificationHandler(w http.ResponseWriter, r *http.Request) {
	// userID := auth.Session.UserID

	var payload struct {
		UserID    int    `json:"user_id"`
		InviterID int    `json:"inviter_id"`
		GroupID   *int   `json:"group_id"`  
		EventID   *int   `json:"event_id"`  
		Type      string `json:"type"`
		Message   string `json:"message"`
		Status    string `json:"status"`    
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON input", http.StatusBadRequest)
		return
	}

	// if payload.InviterID != userID {
	// 	http.Error(w, "Forbidden: inviter ID must match session user", http.StatusForbidden)
	// 	return
	// }

	if payload.UserID == payload.InviterID {
		http.Error(w, "Cannot send notification to yourself", http.StatusForbidden)
		return
	}

	groupID := sql.NullInt64{}
	if payload.GroupID != nil {
		groupID = sql.NullInt64{Int64: int64(*payload.GroupID), Valid: true}
	}

	eventID := sql.NullInt64{}
	if payload.EventID != nil {
		eventID = sql.NullInt64{Int64: int64(*payload.EventID), Valid: true}
	}

	if payload.Status == "" {
		payload.Status = "pending"
	}

	err := CreateNotification(payload.UserID, payload.InviterID, groupID, eventID, payload.Type, payload.Message, payload.Status)
	if err != nil {
		http.Error(w, "Failed to create notification", http.StatusInternalServerError)
		return
	}

	if payload.Type == "join_request" || payload.Type == "group_invite" {
		if conn, ok := auth.ActiveUsers[payload.UserID]; ok {
			fmt.Printf("New notification: %s for user %d\n", payload.Type, payload.UserID)

			notifs, err := FetchUnreadNotifications(payload.UserID)
			if err != nil {
				log.Printf("Failed to fetch unread notifications for user %d: %v", payload.UserID, err)
			} else {
				conn.WriteJSON(map[string]interface{}{
					"type":          "notifications-list",
					"notifications": notifs,
				})
			}
		}
	}

	w.WriteHeader(http.StatusCreated)
}

func FetchUnreadNotifications(userID int) ([]map[string]interface{}, error) {
	rows, err := sqlite.DB.Query(`
		SELECT id, inviter_id, group_id, event_id, type, message, status, created_at, read
		FROM notifications
		WHERE user_id = ?`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifs []map[string]interface{}

	for rows.Next() {
		var id, inviterID int
		var groupID, eventID sql.NullInt64
		var notifType, message, status, createdAt string
		var read bool

		if err := rows.Scan(&id, &inviterID, &groupID, &eventID, &notifType, &message, &status, &createdAt, &read); err != nil {
			continue
		}

		notif := map[string]interface{}{
			"id":         id,
			"inviter_id": inviterID,
			"group_id":   nil,
			"event_id":   nil,
			"type":       notifType,
			"message":    message,
			"status":     status,
			"created_at": createdAt,
			"read":       read, 
		}
		if groupID.Valid {
			notif["group_id"] = groupID.Int64
		}
		if eventID.Valid {
			notif["event_id"] = eventID.Int64
		}

		notifs = append(notifs, notif)
	}

	return notifs, nil
}


func UpdateNotificationStatusHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		ID     int    `json:"id"`     
		Status string `json:"status"` 
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON input", http.StatusBadRequest)
		return
	}

	if payload.ID == 0 || payload.Status == "" {
		http.Error(w, "Missing fields", http.StatusBadRequest)
		return
	}

	err := UpdateNotificationStatus(payload.ID, payload.Status)
	if err != nil {
		log.Printf("Failed to update notification %d: %v", payload.ID, err)
		http.Error(w, "Failed to update notification", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}



func UpdateNotificationStatus(notificationID int, newStatus string) error {
	query := `UPDATE notifications SET status = ? WHERE id = ?`
	_, err := sqlite.DB.Exec(query, newStatus, notificationID)
	return err
}

func MarkAllNotificationsRead(userID int) error {
	_, err := sqlite.DB.Exec(`
		UPDATE notifications
		SET read = 1
		WHERE user_id = ? AND read = 0
	`, userID)
	return err
}

func MarkAllNotificationsReadHandler(w http.ResponseWriter, r *http.Request) {
	err := MarkAllNotificationsRead(auth.Session.UserID)
	if err != nil {
		log.Println("Failed to mark notifications as read:", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "All notifications marked as read"}`))
}
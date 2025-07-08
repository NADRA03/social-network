package auth

import (
	"encoding/json"
	"log"
	"net/http"
	"social-network/pkg/db/sqlite"
    "database/sql"
	"github.com/gorilla/websocket"
)


var ActiveUsers = make(map[int]*websocket.Conn)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func UserWebSocket(w http.ResponseWriter, r *http.Request) {
	log.Println("[WebSocket] New connection attempt")

	cookie, err := r.Cookie("session")
	if err != nil {
		log.Println("[WebSocket] Missing session cookie")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	if cookie.Value != Session.SessionID {
		log.Printf("[WebSocket] Session ID mismatch: got %s, expected %s\n", cookie.Value, Session.SessionID)
	}

	userID := Session.UserID
	log.Printf("[WebSocket] Session validated for user %d", userID)

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("[WebSocket] Upgrade failed:", err)
		return
	}

	log.Printf("[WebSocket] User %d connected", userID)
	ActiveUsers[userID] = conn

	broadcastUserList(r, userID)

	defer func() {
		log.Printf("[WebSocket] User %d disconnected", userID)
		conn.Close()
		delete(ActiveUsers, userID)
		broadcastUserList(r, userID)
	}()

	for {
		var msg struct {
			Type string `json:"type"`
			To   int    `json:"to"`
			Text string `json:"text"`
		}

		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("[WebSocket] Read error:", err)
			break
		}

		switch msg.Type {
		case "chat":
			log.Printf("[WebSocket] User %d sending message to %d: %s", userID, msg.To, msg.Text)
			_, err := sqlite.DB.Exec(
				`INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
				userID, msg.To, msg.Text)
			if err != nil {
				log.Println("[DB] Failed to save message:", err)
				continue
			}

			var senderUsername string
			err = sqlite.DB.QueryRow(`SELECT username FROM users WHERE id = ?`, userID).Scan(&senderUsername)
			if err != nil {
				log.Println("[DB] Failed to get sender username:", err)
				senderUsername = "Unknown"
			}

			if receiverConn, ok := ActiveUsers[msg.To]; ok {
				out := map[string]interface{}{
					"type":     "chat",
					"from":     userID,
					"username": senderUsername,
					"text":     msg.Text,
				}
				receiverConn.WriteJSON(out)
			}

			broadcastUserList(r, userID)

		case "typing", "stop":
			log.Printf("[WebSocket] User %d is %s to %d", userID, msg.Type, msg.To)
			var senderUsername string
			err = sqlite.DB.QueryRow(`SELECT username FROM users WHERE id = ?`, userID).Scan(&senderUsername)
			if err != nil {
				log.Println("[DB] Failed to get sender username:", err)
				senderUsername = "Unknown"
			}

			if rc, ok := ActiveUsers[msg.To]; ok {
				rc.WriteJSON(map[string]interface{}{
					"type":     msg.Type,
					"from":     userID,
					"username": senderUsername,
				})
			}

			case "group-chat":
				log.Printf("[WebSocket] User %d sending group message to group %d: %s", userID, msg.To, msg.Text)

				_, err := sqlite.DB.Exec(
					`INSERT INTO messages (sender_id, group_id, content) VALUES (?, ?, ?)`,
					userID, msg.To, msg.Text)
				if err != nil {
					log.Println("[DB] Failed to save group message:", err)
					continue
				}

				var senderUsername, groupName string

				err = sqlite.DB.QueryRow(`SELECT username FROM users WHERE id = ?`, userID).Scan(&senderUsername)
				if err != nil {
					log.Println("[DB] Failed to get sender username:", err)
					senderUsername = "Unknown"
				}

				err = sqlite.DB.QueryRow(`SELECT name FROM groups WHERE id = ?`, msg.To).Scan(&groupName)
				if err != nil {
					log.Println("[DB] Failed to get group name:", err)
					groupName = "Unknown Group"
				}

				rows, err := sqlite.DB.Query(`SELECT user_id FROM group_members WHERE group_id = ?`, msg.To)
				if err != nil {
					log.Println("[DB] Failed to fetch group members:", err)
					continue
				}
				defer rows.Close()

				for rows.Next() {
					var memberID int
					if err := rows.Scan(&memberID); err != nil {
						log.Println("[DB] Failed to scan group member:", err)
						continue
					}

					if memberID == userID {
						continue
					}

					if memberConn, ok := ActiveUsers[memberID]; ok {
						out := map[string]interface{}{
							"type":       "group-chat",
							"from":       userID,
							"group":      msg.To,
							"groupName":  groupName,
							"username":   senderUsername,
							"text":       msg.Text,
						}
						memberConn.WriteJSON(out)
					}
				}

			broadcastUserList(r, userID)
		}
	}
}

type UserListResponse struct {
	Type      string `json:"type"`
	OnlineIDs []int  `json:"online"`
	Users     []User `json:"users"`
}

type GroupListResponse struct {
	Type   string                 `json:"type"`
	Groups []GroupWithLastMessage `json:"groups"`
}


func broadcastUserList(r *http.Request, _ int) {
	var onlineIDs []int
	for id := range ActiveUsers {
		onlineIDs = append(onlineIDs, id)
	}

	for userID, conn := range ActiveUsers {

		users, err := GetConnectedUsersForUser(userID, onlineIDs)
		if err != nil {
			log.Printf("Error getting user list for user %d: %v", userID, err)
			continue
		}

		userMsg, err := json.Marshal(UserListResponse{
			Type:      "userlist",
			OnlineIDs: onlineIDs,
			Users:     users,
		})
		if err == nil {
			conn.WriteMessage(websocket.TextMessage, userMsg)
		}

		groups, err := GetJoinedGroupsForUser(userID)
		if err != nil {
			log.Printf("Error getting group list for user %d: %v", userID, err)
			continue
		}

		groupMsg, err := json.Marshal(GroupListResponse{
			Type:   "grouplist",
			Groups: groups,
		})
		if err == nil {
			conn.WriteMessage(websocket.TextMessage, groupMsg)
		}

		notifs, err := GetUnreadNotifications(userID)
			if err != nil {
			log.Printf("Error fetching notifications for user %d: %v", userID, err)
			} else {
			notifMsg, err := json.Marshal(map[string]interface{}{
			"type":          "notifications-list",
			"notifications": notifs,
			})
			if err == nil {
			conn.WriteMessage(websocket.TextMessage, notifMsg)
			}
			}
		}
}

func GetUnreadNotifications(userID int) ([]map[string]interface{}, error) {
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
			log.Println("Notification scan error:", err)
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

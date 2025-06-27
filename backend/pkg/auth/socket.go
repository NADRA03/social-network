package auth

import (
	"encoding/json"
	"log"
	"net/http"
	"social-network/pkg/db/sqlite"

	"github.com/gorilla/websocket"
)


var activeUsers = make(map[int]*websocket.Conn)

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
	activeUsers[userID] = conn

	broadcastUserList(r, userID)

	defer func() {
		log.Printf("[WebSocket] User %d disconnected", userID)
		conn.Close()
		delete(activeUsers, userID)
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

			if receiverConn, ok := activeUsers[msg.To]; ok {
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

			if rc, ok := activeUsers[msg.To]; ok {
				rc.WriteJSON(map[string]interface{}{
					"type":     msg.Type,
					"from":     userID,
					"username": senderUsername,
				})
			}
		}
	}
}


func broadcastUserList(r *http.Request, _ int) {
	var onlineIDs []int
	for id := range activeUsers {
		onlineIDs = append(onlineIDs, id)
	}

	type Response struct {
		Type      string `json:"type"`
		OnlineIDs []int  `json:"online"`
		Users     []User `json:"users"`
	}

	for userID, conn := range activeUsers {

		var sessionID string
		err := sqlite.DB.QueryRow(`SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, userID).Scan(&sessionID)
		if err != nil {
			log.Printf("Failed to get session for user %d: %v", userID, err)
			continue
		}



		users, err := GetConnectedUsersForUser(userID, onlineIDs)
		if err != nil {
			log.Printf("Error getting user list for user %d: %v", userID, err)
			continue
		}

		msg, err := json.Marshal(Response{
			Type:      "userlist",
			OnlineIDs: onlineIDs,
			Users:     users,
		})
		if err != nil {
			log.Printf("Error marshaling user list for user %d: %v", userID, err)
			continue
		}

		err = conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Printf("Error sending user list to user %d: %v", userID, err)
		}
	}
}


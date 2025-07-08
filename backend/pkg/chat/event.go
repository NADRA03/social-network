package chat

import (
	"social-network/pkg/db/sqlite"
	"net/http"	
	"encoding/json"
	"social-network/pkg/auth"
	"strconv"
	"fmt"
	"log"
	"time"
	"database/sql"
)


type Event struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	HostID      int       `json:"host_id"`
	GroupID     int       `json:"group_id"`
	Time        string    `json:"time"`
	Location    string    `json:"location"`
	CreatedAt   string    `json:"created_at"`
	Read        bool   `json:"read"`

}

type EventWithPolls struct {
	Event
	Polls []Poll `json:"polls"`
	VotedOptionID *int   `json:"voted_option_id"`
}

type Poll struct {
	ID         int    `json:"id"`
	EventID    int    `json:"event_id"`
	OptionText string `json:"option_text"`
	Votes      int    `json:"votes"`
}



func CreatePollOptions(eventID int, options []Poll) error {
	query := `INSERT INTO polls (event_id, option_text) VALUES (?, ?)`

	for _, poll := range options {
		_, err := sqlite.DB.Exec(query, eventID, poll.OptionText)
		if err != nil {
			return fmt.Errorf("failed to insert poll option: %w", err)
		}
	}
	return nil
}

func CreateEvent(e Event) (int64, error) {
	query := `INSERT INTO events (name, description, host_id, group_id, time, location) VALUES (?, ?, ?, ?, ?, ?)`
	result, err := sqlite.DB.Exec(query, e.Name, e.Description, e.HostID, e.GroupID, e.Time, e.Location)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func GetEventsByGroup(groupID int) ([]Event, error) {
	query := `SELECT id, name, description, host_id, group_id, time, location, created_at FROM events WHERE group_id = ? ORDER BY time ASC`
	rows, err := sqlite.DB.Query(query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		err := rows.Scan(&e.ID, &e.Name, &e.Description, &e.HostID, &e.GroupID, &e.Time, &e.Location, &e.CreatedAt)
		if err != nil {
			return nil, err
		}
		events = append(events, e)
	}
	return events, nil
}

func CreateEventHandler(w http.ResponseWriter, r *http.Request) {
	userID := auth.Session.UserID

	var payload EventWithPolls
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	payload.HostID = userID
	eventID, err := CreateEvent(payload.Event)
	if err != nil {
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	var insertedPolls []Poll
	var votedOptionID *int

	if len(payload.Polls) > 0 {
		err := CreatePollOptions(int(eventID), payload.Polls)
		if err != nil {
			http.Error(w, "Event created but failed to create polls", http.StatusInternalServerError)
			return
		}

		insertedPolls, votedOptionID, err = GetPollsForEvent(int(eventID), userID)
		if err != nil {
			http.Error(w, "Failed to fetch poll data", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(EventWithPolls{
		Event: Event{
			ID:          int(eventID),
			Name:        payload.Name,
			Description: payload.Description,
			HostID:      userID,
			GroupID:     payload.GroupID,
			Time:        payload.Time,
			Location:    payload.Location,
			CreatedAt:   time.Now().Format(time.RFC3339),
		},
		Polls:         insertedPolls,
		VotedOptionID: votedOptionID,
	})

	// Notify users in background
	go func(eventID int64, userID int, payload EventWithPolls) {
		rows, err := sqlite.DB.Query(`SELECT user_id FROM group_members WHERE group_id = ?`, payload.GroupID)
		if err != nil {
			log.Println("Failed to fetch group members:", err)
			return
		}
		defer rows.Close()

		var notifyTargets []int
		tx, err := sqlite.DB.Begin()
		if err != nil {
			log.Println("Failed to begin transaction:", err)
			return
		}

		var groupName, eventName string
		_ = sqlite.DB.QueryRow(`SELECT name FROM groups WHERE id = ?`, payload.GroupID).Scan(&groupName)
		_ = sqlite.DB.QueryRow(`SELECT name FROM events WHERE id = ?`, eventID).Scan(&eventName)
		if groupName == "" {
			groupName = "your group"
		}
		if eventName == "" {
			eventName = "an event"
		}
		message := fmt.Sprintf("A new event '%s' posted in group '%s'.", eventName, groupName)

		for rows.Next() {
			var memberID int
			if err := rows.Scan(&memberID); err != nil {
				log.Println("Failed to scan group member:", err)
				continue
			}
			if memberID == userID {
				continue
			}

			_, err := tx.Exec(`
				INSERT INTO notifications (user_id, inviter_id, group_id, event_id, type, message, status)
				VALUES (?, ?, ?, ?, ?, ?, ?)`,
				memberID, userID,
				sql.NullInt64{Int64: int64(payload.GroupID), Valid: true},
				sql.NullInt64{Int64: eventID, Valid: true},
				"event_invite",
				message,
				"unread",
			)
			if err != nil {
				log.Printf("Failed to notify user %d: %v", memberID, err)
				continue
			}
			notifyTargets = append(notifyTargets, memberID)
		}

		// Fetch notifications before committing
		notificationsByUser := make(map[int][]map[string]interface{})
		for _, memberID := range notifyTargets {
			rows, err := tx.Query(`
				SELECT id, inviter_id, group_id, event_id, type, message, status, created_at, read 
				FROM notifications 
				WHERE user_id = ?`, memberID)
			if err != nil {
				log.Printf("Failed to fetch notifications for user %d in tx: %v", memberID, err)
				continue
			}

			var notifs []map[string]interface{}
			for rows.Next() {
				var id, inviterID int
				var groupID, eventID sql.NullInt64
				var notifType, message, status, createdAt string
				var read bool

				if err := rows.Scan(&id, &inviterID, &groupID, &eventID, &notifType, &message, &status, &createdAt, &read); err != nil {
					log.Println("Scan error:", err)
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
					"read": read,
				}
				if groupID.Valid {
					notif["group_id"] = groupID.Int64
				}
				if eventID.Valid {
					notif["event_id"] = eventID.Int64
				}
				notifs = append(notifs, notif)
			}
			rows.Close()
			notificationsByUser[memberID] = notifs
		}

		if err := tx.Commit(); err != nil {
			log.Println("Failed to commit notifications transaction:", err)
			return
		}

		for memberID, notifs := range notificationsByUser {
			if conn, ok := auth.ActiveUsers[memberID]; ok {
				conn.WriteJSON(map[string]interface{}{
					"type":          "notifications-list",
					"notifications": notifs,
				})
			}
		}
	}(eventID, userID, payload)
}


func GetPollsForEvent(eventID, sessionUserID int) ([]Poll, *int, error) {
	query := `
	SELECT 
		polls.id, 
		polls.event_id, 
		polls.option_text, 
		COUNT(poll_votes.id) AS votes
	FROM polls
	LEFT JOIN poll_votes ON polls.id = poll_votes.option_id
	WHERE polls.event_id = ?
	GROUP BY polls.id
	ORDER BY polls.id ASC
	`

	rows, err := sqlite.DB.Query(query, eventID)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()

	var polls []Poll
	for rows.Next() {
		var p Poll
		if err := rows.Scan(&p.ID, &p.EventID, &p.OptionText, &p.Votes); err != nil {
			return nil, nil, err
		}
		polls = append(polls, p)
	}

	var votedOptionID *int
	voteQuery := `SELECT option_id FROM poll_votes WHERE user_id = ? AND option_id IN (SELECT id FROM polls WHERE event_id = ?)`
	err = sqlite.DB.QueryRow(voteQuery, sessionUserID, eventID).Scan(&votedOptionID)
	if err == sql.ErrNoRows {
		votedOptionID = nil
	} else if err != nil {
		return nil, nil, err
	}

	return polls, votedOptionID, nil
}


func GetGroupEventsHandler(w http.ResponseWriter, r *http.Request) {
	session, err := auth.GetSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	sessionUserID := session.UserID

	groupIDStr := r.URL.Query().Get("group_id")
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	events, err := GetEventsByGroup(groupID)
	if err != nil {
		http.Error(w, "Failed to fetch events", http.StatusInternalServerError)
		return
	}

	var eventsWithPolls []EventWithPolls
	for _, event := range events {
		polls, votedOptionID, err := GetPollsForEvent(event.ID, sessionUserID)
		if err != nil {
			log.Printf("Failed to get polls for event %d: %v", event.ID, err)
			polls = []Poll{}
		}

		eventsWithPolls = append(eventsWithPolls, EventWithPolls{
			Event:         event,
			Polls:         polls,
			VotedOptionID: votedOptionID, 
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(eventsWithPolls)
}

func VotePollOption(userID, optionID int) error {
	var eventID int
	err := sqlite.DB.QueryRow(`
		SELECT event_id FROM polls WHERE id = ?
	`, optionID).Scan(&eventID)
	if err != nil {
		return fmt.Errorf("failed to get event_id for option_id: %w", err)
	}

	var alreadyVoted bool
	err = sqlite.DB.QueryRow(`
		SELECT EXISTS (
			SELECT 1
			FROM poll_votes pv
			JOIN polls p ON pv.option_id = p.id
			WHERE pv.user_id = ? AND p.event_id = ?
		)
	`, userID, eventID).Scan(&alreadyVoted)
	if err != nil {
		return fmt.Errorf("failed to check existing vote: %w", err)
	}
	if alreadyVoted {
		return fmt.Errorf("user has already voted in this event")
	}

	_, err = sqlite.DB.Exec(`
		INSERT INTO poll_votes (user_id, option_id)
		VALUES (?, ?)
	`, userID, optionID)

	return err
}

func VotePollHandler(w http.ResponseWriter, r *http.Request) {
	userID := auth.Session.UserID 

	var payload struct {
		OptionID int `json:"option_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid JSON input", http.StatusBadRequest)
		return
	}

	if payload.OptionID == 0 {
		http.Error(w, "Missing option_id", http.StatusBadRequest)
		return
	}

	err := VotePollOption(userID, payload.OptionID)
	if err != nil {
		log.Println("Vote error:", err)
		http.Error(w, "Failed to record vote", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}
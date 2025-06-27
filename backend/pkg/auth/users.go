package auth

import (
	"log"
	"database/sql"
	"social-network/pkg/db/sqlite"
)

type User struct {
	ID               int
	Username         string
	Email            string
	FirstName        string
	LastName         string
	Age              int
	Gender           string
	CreatedAt        string
	ImageURL         string
	LastMessageTime  sql.NullString
	LastMessageText  sql.NullString
	LastMessageFrom  sql.NullInt64  
	LastMessageOwner string      
}

func GetConnectedUsersForUser(sessionUserID int, onlineIDs []int) ([]User, error) {
	query := `
	SELECT DISTINCT
		u.id, u.username, u.email, u.created_at, u.avatar_url,
		DATETIME(MAX(m.created_at)) AS last_message_time,
		(
			SELECT content
			FROM messages
			WHERE 
				(sender_id = u.id AND receiver_id = ?) OR 
				(sender_id = ? AND receiver_id = u.id)
			ORDER BY created_at DESC
			LIMIT 1
		) AS last_message,
		(
			SELECT sender_id
			FROM messages
			WHERE 
				(sender_id = u.id AND receiver_id = ?) OR 
				(sender_id = ? AND receiver_id = u.id)
			ORDER BY created_at DESC
			LIMIT 1
		) AS last_sender_id
	FROM users u
	LEFT JOIN messages m 
		ON (
			(m.sender_id = u.id AND m.receiver_id = ?) OR
			(m.sender_id = ? AND m.receiver_id = u.id)
		)
	WHERE u.id IN (
		SELECT followed_id FROM followers WHERE follower_id = ?
		UNION
		SELECT follower_id FROM followers WHERE followed_id = ?
	) AND u.id != ?
	GROUP BY u.id
	ORDER BY 
		(last_message_time IS NULL), last_message_time DESC, u.username ASC
	`

	rows, err := sqlite.DB.Query(query,
		sessionUserID, sessionUserID,
		sessionUserID, sessionUserID,
		sessionUserID, sessionUserID,
		sessionUserID, sessionUserID, sessionUserID,
	)
	if err != nil {
		log.Printf("Error querying connected users: %v", err)
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		err := rows.Scan(
			&u.ID, &u.Username, &u.Email, &u.CreatedAt, &u.ImageURL,
			&u.LastMessageTime, &u.LastMessageText, &u.LastMessageFrom,
		)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			return nil, err
		}

		if u.LastMessageFrom.Valid {
			if int(u.LastMessageFrom.Int64) == sessionUserID {
				u.LastMessageOwner = "outgoing"
			} else {
				u.LastMessageOwner = "incoming"
			}
		}

		users = append(users, u)
	}

	return users, nil
}



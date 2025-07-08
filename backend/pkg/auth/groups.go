package auth 

import (
	"database/sql"
	"social-network/pkg/db/sqlite"
	"fmt"
)


type GroupWithLastMessage struct {
	ID               int
	Name             string
	Description      string
	CreatorID        int
	CreatedAt        string
	LastMessage      sql.NullString
	LastSenderID     sql.NullInt64
	LastMessageTime  sql.NullString
	LastMessageOwner string // "incoming" or "outgoing"
}

func GetJoinedGroupsForUser(userID int) ([]GroupWithLastMessage, error) {
	query := `
	SELECT 
		g.id, g.name, g.description, g.creator_id, g.created_at,
		(
			SELECT content
			FROM messages
			WHERE group_id = g.id
			ORDER BY created_at DESC
			LIMIT 1
		) AS last_message,
		(
			SELECT sender_id
			FROM messages
			WHERE group_id = g.id
			ORDER BY created_at DESC
			LIMIT 1
		) AS last_sender_id,
		(
			SELECT created_at
			FROM messages
			WHERE group_id = g.id
			ORDER BY created_at DESC
			LIMIT 1
		) AS last_message_time
	FROM groups g
	INNER JOIN group_members gm ON gm.group_id = g.id
	WHERE gm.user_id = ?
	ORDER BY last_message_time DESC NULLS LAST, g.name ASC
	`

	rows, err := sqlite.DB.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("query failed: %v", err)
	}
	defer rows.Close()

	var groups []GroupWithLastMessage
	for rows.Next() {
		var g GroupWithLastMessage
		var senderID sql.NullInt64
		var lastMsg sql.NullString
		var lastTime sql.NullString

		err := rows.Scan(
			&g.ID, &g.Name, &g.Description, &g.CreatorID, &g.CreatedAt,
			&lastMsg, &senderID, &lastTime,
		)
		if err != nil {
			return nil, fmt.Errorf("scan failed: %v", err)
		}

		g.LastMessage = lastMsg
		g.LastSenderID = senderID
		g.LastMessageTime = lastTime

		if senderID.Valid && senderID.Int64 == int64(userID) {
			g.LastMessageOwner = "outgoing"
		} else if senderID.Valid {
			g.LastMessageOwner = "incoming"
		}

		groups = append(groups, g)
	}

	return groups, nil
}


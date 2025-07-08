CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,           -- recipient of the notification
  inviter_id INTEGER,                 -- sender/requester (e.g., follower, group inviter)
  group_id INTEGER,                   -- optional group reference
  event_id INTEGER,                   -- optional event reference
  type TEXT NOT NULL,                 -- e.g., follow_request, group_invite, join_request, group_event
  message TEXT NOT NULL,              -- notification text
  status TEXT DEFAULT 'pending',      -- pending | accepted | rejected (optional)
  read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (inviter_id) REFERENCES users(id),
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);
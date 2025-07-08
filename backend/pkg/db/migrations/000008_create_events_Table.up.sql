CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    host_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    time DATETIME NOT NULL,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(host_id) REFERENCES users(id),
    FOREIGN KEY(group_id) REFERENCES groups(id)
);
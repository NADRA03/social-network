CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nickname TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_private BOOLEAN DEFAULT 0
);

CREATE TRIGGER set_username AFTER INSERT ON users
BEGIN
    UPDATE users
    SET username = LOWER(NEW.first_name) || LOWER(NEW.last_name) ||
                  CASE WHEN (
                      SELECT COUNT(*) FROM users 
                      WHERE username = LOWER(NEW.first_name) || LOWER(NEW.last_name)
                      AND id != NEW.id
                  ) > 0
                  THEN NEW.id 
                  ELSE '' 
                  END
    WHERE id = NEW.id;
END;
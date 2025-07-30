# 🌐 Social Network Platform

A full-stack **modern social networking platform** that enables users to chat, post, vote in polls, join groups, and explore community events — all with a sleek, responsive interface.

## Features

- **JWT Authentication** (Login, Register, Session Management)
- **Real-Time Chat** (Direct, Group)
- **Posts with Reactions & Comments**
- **Polls and Voting**
- **Group Events**
- **User Groups & Member Management**
- **Search Bar with Live Suggestions**
- **Gradient-Themed UI** using Tailwind CSS + DaisyUI
- **Image Uploads via Supabase**
- **Responsive Design** (Desktop & Mobile)
- **Real-Time Notification System**

## Tech Stack

| Frontend                  | Backend          | Database   | Realtime  | DevOps         |
|---------------------------|------------------|------------|-----------|----------------|
| React / Next.js           | Go (Golang)      | SQLite     | WebSocket | Docker Compose |
| Zustand (Global State)    | REST API         |            |           |                |
| Tailwind CSS + DaisyUI    | Gorilla Mux      |            |           |                |
| Supabase (Images/Storage) | JWT Auth (Custom)|            |           |                |

## Project Structure

```
/frontend
  ├─ /components
  ├─ /pages
  ├─ /store (Zustand)
  ├─ /utils (API helpers)
  └─ tailwind.config.js

/backend
  ├─ /cmd/server.go
  ├─ /handlers
  ├─ /models
  ├─ /routes
  └─ main.go

/docker
  └─ docker-compose.yml
```

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/social-network.git
cd social-network
```

### 2. Run Backend (Go)

```bash
cd backend
go mod tidy
go run cmd/server.go
```

### 3. Run Frontend (React + Next.js)

```bash
cd frontend
npm install
npm run dev
```

### 4. (Optional) Docker Setup

```bash
docker-compose up --build
```

## Screenshots

> (Include screenshots of the Home page, Chat UI, Post creation modal, Poll voting, and Mobile layout.)

## Future Plans

- Admin moderation panel
- Dark mode toggle

## 👤 Authors

**Malak Ahmed**  
Full-stack developer & cybersecurity enthusiast
(https://github.com/NADRA03)

**Zahra**
Full-stack developer & cybersecurity enthusiast
(https://github.com/zahraalhaj)


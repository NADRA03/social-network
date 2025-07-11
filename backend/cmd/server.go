package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"social-network/pkg/auth"
	"social-network/pkg/db/sqlite"
	"social-network/pkg/posts"
	"social-network/pkg/profile"
	"social-network/pkg/chat"
    "social-network/pkg/notification"
	// "social-network/pkg/profile"

	"github.com/gorilla/mux"
)

func main() {
	cwd, err := os.Getwd()
	if err != nil {
		log.Fatal("Failed to get working directory:", err)
	}

	migrationDir := filepath.Join(cwd, "..", "pkg", "db", "migrations")
	migrationPath := "file://" + filepath.ToSlash(migrationDir)

	dbPath := filepath.Join(cwd, "..", "social.db")

	sqlite.InitDB(dbPath, migrationPath)
	defer sqlite.DB.Close()

	r := mux.NewRouter()

	// Basic health check
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("API is running"))
	})

	// Auth routes
	r.Handle("/register", auth.RegisterHandler(sqlite.DB)).Methods("POST")
	r.Handle("/login", auth.LoginHandler(sqlite.DB)).Methods("POST")
    r.Handle("/ws", auth.AuthMiddleware(http.HandlerFunc(auth.UserWebSocket))).Methods("GET")
    r.Handle("/getSession", auth.AuthMiddleware(http.HandlerFunc(auth.GetSessionHandler))).Methods("GET")
	// Profile routes (with auth middleware)
	// r.Handle("/profile/me", auth.AuthMiddleware(http.HandlerFunc(profile.GetOwnProfileHandler))).Methods("GET")
	// r.HandleFunc("/users/{id}", profile.GetUserProfileHandler).Methods("GET")

	// Profile routes
	r.Handle("/profile/{username}", auth.AuthMiddleware(http.HandlerFunc(profile.GetOwnProfileHandler))).Methods("GET")
	r.Handle("/users/{username}", auth.AuthMiddleware(http.HandlerFunc(profile.GetUserProfileHandler))).Methods("GET")
	r.Handle("/profile/privacy", auth.AuthMiddleware(http.HandlerFunc(profile.TogglePrivacyHandler(sqlite.DB)))).Methods("PATCH")
	r.Handle("/profile/avatar", auth.AuthMiddleware(http.HandlerFunc(profile.UpdateAvatarHandler))).Methods("PATCH")
	r.Handle("/follow/{username}", auth.AuthMiddleware(profile.FollowHandler(sqlite.DB))).Methods("POST")
	r.Handle("/unfollow/{username}", auth.AuthMiddleware(profile.UnfollowHandler(sqlite.DB))).Methods("DELETE")
	r.Handle("/followers", auth.AuthMiddleware(http.HandlerFunc(profile.GetFollowersHandler))).Methods("GET")
	r.Handle("/profile/close-friends", auth.AuthMiddleware(http.HandlerFunc(profile.GetCloseFriendsHandler))).Methods("GET")
	r.Handle("/profile/close-friends", auth.AuthMiddleware(http.HandlerFunc(profile.CloseFriendsHandler))).Methods("PATCH")
	r.Handle("/users/not-followed", auth.AuthMiddleware(http.HandlerFunc(profile.GetNotFollowedUsersHandler))).Methods("GET")
	// Post routes
	r.Handle("/post", auth.AuthMiddleware(http.HandlerFunc(posts.CreatePostHandler))).Methods("POST")
	r.Handle("/feed", auth.AuthMiddleware(http.HandlerFunc(posts.FeedHandler))).Methods("GET")
	r.Handle("/comment", auth.AuthMiddleware(http.HandlerFunc(posts.CreateCommentHandler))).Methods("POST")
	r.Handle("/comments", auth.AuthMiddleware(http.HandlerFunc(posts.GetCommentsHandler))).Methods("GET")

	r.Handle("/follow/{id}", auth.AuthMiddleware(profile.FollowHandler(sqlite.DB))).Methods("POST")
	r.Handle("/unfollow/{id}", auth.AuthMiddleware(profile.UnfollowHandler(sqlite.DB))).Methods("DELETE")
	//chat 
	r.Handle("/groups", auth.AuthMiddleware(http.HandlerFunc(chat.CreateGroupHandler))).Methods("POST")
    r.Handle("/groups/join", auth.AuthMiddleware(http.HandlerFunc(chat.AddGroupMemberHandler))).Methods("POST")
	r.Handle("/chat/messages", auth.AuthMiddleware(http.HandlerFunc(chat.GetChatMessagesHandler))).Methods("GET")
	r.Handle("/users/search", auth.AuthMiddleware(http.HandlerFunc(chat.SearchUsersHandler))).Methods("POST")
    r.Handle("/groups/messages", auth.AuthMiddleware(http.HandlerFunc(chat.GetGroupMessagesHandler))).Methods("GET")
	r.Handle("/groups/members", auth.AuthMiddleware(http.HandlerFunc(chat.GetGroupMembersHandler))).Methods("GET")
	r.Handle("/groups/events", auth.AuthMiddleware(http.HandlerFunc(chat.CreateEventHandler))).Methods("POST")
    r.Handle("/groups/events", auth.AuthMiddleware(http.HandlerFunc(chat.GetGroupEventsHandler))).Methods("GET")
	r.Handle("/groups/posts", auth.AuthMiddleware(http.HandlerFunc(chat.CreateGroupPost))).Methods("POST")
	r.Handle("/groups/posts", auth.AuthMiddleware(http.HandlerFunc(chat.GetGroupPosts))).Methods("GET")
	r.Handle("/groups/comments", auth.AuthMiddleware(http.HandlerFunc(chat.CreateGroupComment))).Methods("POST")
	r.Handle("/groups/comments", auth.AuthMiddleware(http.HandlerFunc(chat.GetGroupComments))).Methods("GET")
	r.Handle("/groups/search", auth.AuthMiddleware(http.HandlerFunc(chat.SearchGroupsHandler))).Methods("POST")
	r.Handle("/groups/vote", auth.AuthMiddleware(http.HandlerFunc(chat.VotePollHandler))).Methods("POST")

	r.Handle("/notifications", auth.AuthMiddleware(http.HandlerFunc(notification.CreateNotificationHandler))).Methods("POST")
	r.Handle("/notifications/status", auth.AuthMiddleware(http.HandlerFunc(notification.UpdateNotificationStatusHandler))).Methods("POST")
	r.Handle("/notifications/mark-all-read", auth.AuthMiddleware(http.HandlerFunc(notification.MarkAllNotificationsReadHandler))).Methods("POST")
	
	// Apply CORS middleware
	handler := enableCORS(r)

	log.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

// CORS Middleware
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

"use client";

import { appendChatMessage } from "./utils/chat";
const API_BASE = "http://localhost:8080"; 

export let socket: WebSocket | null = null;


async function request(path: string, options: RequestInit = {}) {
	const res = await fetch(`${API_BASE}${path}`, {
		credentials: "include", 
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {})
		},
		...options,
	});
	if (!res.ok) throw new Error(await res.text());
	return res.json().catch(() => ({}));
}

export const register = (data: any) =>
	request("/register", {
		method: "POST",
		body: JSON.stringify(data),
	});

export const login = (data: any) =>
	request("/login", {
		method: "POST",
		body: JSON.stringify(data),
	});

export const getMyProfile = () => request("/profile/me");

export const getUserProfile = (id: number) =>
	request(`/users/${id}`);

export const togglePrivacy = () =>
	request("/profile/privacy", {
		method: "PATCH",
	});

export const followUser = (id: number) =>
	request(`/follow/${id}`, {
		method: "POST",
	});

export const unfollowUser = (id: number) =>
	request(`/unfollow/${id}`, {
		method: "DELETE",
	});

export const getSession = () =>
	request("/getSession", {
		method: "GET",
	});

export const getChatMessages = (
  user1: number,
  user2: number,
  limit = 10,
  offset = 0
) =>
  request(`/chat/messages?user1=${user1}&user2=${user2}&limit=${limit}&offset=${offset}`, {
    method: "GET",
  });


export function connectWebSocket(onMessage: (event: MessageEvent) => void) {
	socket = new WebSocket("ws://localhost:8080/ws");

	socket.onopen = () => {
		console.log("WebSocket connected");
	};

	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);

		switch (data.type) {
			case "chat":
				console.log(`Message from ${data.username} (${data.from}): ${data.text}`);
				appendChatMessage(
					{
						sender_id: data.from,
						text: data.text,
						created_at: new Date().toISOString(),
					},
					data.username
				);
				break;
		}

		onMessage(event);
	};

	socket.onclose = () => {
		console.warn("WebSocket disconnected");
		socket = null;
	};

	socket.onerror = (err) => {
		console.error("WebSocket error:", err);
	};
}

export function disconnectWebSocket() {
	if (socket) {
		socket.close();
		socket = null;
	}
}



// export function setSocket() {
//   socket = new WebSocket("ws://localhost:8080/ws");

//   socket.onopen = () => {
//     console.log("WebSocket connected");
//   };

//   socket.onmessage = function (event) {
//     const data = JSON.parse(event.data);
  
//     switch (data.type) {
//       case "chat":
//         console.log(`Message from ${data.username} (${data.from}): ${data.text}`);
//         showToastU(data.username);
//         appendChatMessage({
//           sender_id: data.from,
//           text: data.text,
//           created_at: new Date().toISOString()
//         }, data.username);
//         break;
  
//       case "userlist":
//         renderUserList(data.users, data.online);
//         break;
      
//       case "typing":
//         showTyping(data.username);
//         break;

//       case "stop":
//         hideTyping();
//         break;
  
//       default:
//         console.warn("Unknown WebSocket message type:", data);
//     }
//   };

//   socket.onclose = () => {
//     console.warn("WebSocket closed");
//   };

//   socket.onerror = (err) => {
//     console.error("WebSocket error:", err);
//   };
// }


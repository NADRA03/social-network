"use client";

import { appendChatMessage } from "./utils/chat";
import { appendGroupChatMessage } from "./utils/groupChat";
import { pushNotifications } from "./utils/notifications";
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

export const searchUsers = (username: string = "") =>
	request("/users/search", {
		method: "POST",
		body: JSON.stringify({ username }),
		headers: {
			"Content-Type": "application/json",
		},
	});

export const searchGroups = (name: string = "") =>
	request("/groups/search", {
		method: "POST",
		body: JSON.stringify({ name }),
		headers: {
			"Content-Type": "application/json",
		},
	});

export const getGroupMembers = (group_id: number | null) =>
  request("/groups/members?group_id=" + group_id, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createGroup = (payload: { name: string; description: string }) =>
	request("/groups", {
		method: "POST",
		body: JSON.stringify(payload),
		headers: {
			"Content-Type": "application/json",
		},
	});

export const joinGroup = (group_id: number, user_id: number) =>
  request("/groups/join", {
    method: "POST",
    body: JSON.stringify({ group_id, user_id }),
    headers: {
      "Content-Type": "application/json",
    },
  });

export const votePoll = (option_id: number) =>
  request("/groups/vote", {
    method: "POST",
    body: JSON.stringify({ option_id }),
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createNotification = (payload: {
	user_id: number;
	inviter_id: number;
	group_id?: number;
	event_id?: number;
	type: string;
	message: string;
	status?: string;
}) =>
	request("/notifications", {
		method: "POST",
		body: JSON.stringify(payload),
		headers: {
			"Content-Type": "application/json",
		},
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

export const getGroupMessages = (
  groupId: number,
  limit = 10,
  offset = 0
) =>
  request(
    `/groups/messages?group_id=${groupId}&limit=${limit}&offset=${offset}`,
    {
      method: "GET",
    }
);

export const createGroupEvent = (payload: {
  group_id: number;
  name: string;
  description: string;
  time: string;
  location: string;
  polls?: { option_text: string }[];
}) =>
  request("/groups/events", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      polls: payload.polls || [], 
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getGroupEvents = (groupId: number) =>
  request(`/groups/events?group_id=${groupId}`, {
    method: "GET",
});

export const createGroupPost = (data: {
  group_id: number;
  content: string;
  image_url?: string;
}) =>
  request("/groups/posts", {
    method: "POST",
    body: JSON.stringify(data),
});

export const getGroupPosts = (groupId: number) =>
  request(`/groups/posts?group_id=${groupId}`, {
    method: "GET",
});

export const createGroupComment = (data: {
  post_id: number;
  content: string;
}) =>
  request("/groups/comments", {
    method: "POST",
    body: JSON.stringify(data),
});

export const getGroupComments = (postId: number) =>
  request(`/groups/comments?post_id=${postId}`, {
    method: "GET",
});

export const updateNotificationStatus = (id: number, status: string) =>
  request("/notifications/status", {
    method: "POST",
    body: JSON.stringify({ id, status }),
    headers: {
      "Content-Type": "application/json",
    },
  });

export const markAllNotificationsAsRead = () =>
  request("/notifications/mark-all-read", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
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

			case "group-chat":
				console.log(`Group message in ${data.group} from ${data.username} (${data.from}): ${data.text}`);
				appendGroupChatMessage({
					sender_id: data.from,
					text: data.text,
					created_at: new Date().toISOString(),
					group_id: data.group,
				}, data.username, data.groupName);
				break;

      case "notifications-list":
        pushNotifications(data); 
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


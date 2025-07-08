"use client";

import { session } from "./session";
import { getChatMessages } from "../api";
import { useGroupStore } from "./store";
import { getSelectedGroupId, getSelectedUserId } from "./store";
import { showToastU } from "./toast";
import { socket } from "../api";
import { getGroupMessages } from "../api";


type ChatMessage = {
	sender_id: number;
	text: string;
	created_at: string;
	group_id: number | null;
};

export function appendGroupChatMessage(msg: ChatMessage, senderName: string, groupName: string | null): void {
  const currentGroupId = getSelectedGroupId();
		if (msg.group_id !== currentGroupId) {
      console.log("a toast here");
		showToastU(`New message in group "${groupName}"`);
		return;
	}
	const isMe = msg.sender_id === session.UserID;
	const bubbleSide = isMe ? "chat-end" : "chat-start";
	const displayName = isMe ? session.Username : senderName;
	const initial = displayName[0]?.toUpperCase() || "?";

	const chatBox = document.getElementById("chat-messages");
	if (!chatBox) return;

	const html = `
    <div class="chat ${bubbleSide}">
      <div class="chat-image avatar">
        <div class="w-10 rounded-full">
          <div class="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
            <span class="font-medium text-gray-600 dark:text-gray-300">${initial}</span>
          </div>
        </div>
      </div>
      <div class="chat-header">
        ${displayName}
        <time class="text-xs opacity-50">${msg.created_at?.slice(0, 16).replace("T", " ")}</time>
      </div>
      <div class="chat-bubble ${isMe ? "bg-base-200 text-black" : "bg-base-200 text-black"}" style="
        word-break: break-word;        
        overflow-wrap: break-word;      
        overflow-x: hidden;">
        ${msg.text}
      </div>
      <div class="chat-footer opacity-50">
        ${isMe ? "Seen" : "Delivered"}
      </div>
    </div>
  `;

	chatBox.innerHTML += html;
	chatBox.scrollTop = chatBox.scrollHeight;
}

export async function loadGroupChatHistory(
  groupId: number,
  groupName: string,
  members: Record<number, string>, 
  limit = 10,
  offset = 0
) {

  try {
    const messages: ChatMessage[] = await getGroupMessages(groupId, limit, offset);

    const chatBox = document.getElementById("chat-messages");
    if (!chatBox) return;
    if (offset === 0) {
      chatBox.innerHTML = "";
    }

    messages.reverse().forEach((msg) => {
      const wrapper = document.createElement("div");
      const senderName = members[msg.sender_id] || "User";
      wrapper.innerHTML = createGroupChatMessageHTML(msg, senderName, groupName);
      chatBox.prepend(wrapper.firstElementChild!);
    });
  } catch (error) {
    console.error("Failed to load group chat history:", error);
  }
}

function createGroupChatMessageHTML(
  msg: ChatMessage,
  senderName: string,
  groupName: string
): string {
  const isMe = msg.sender_id === session.UserID;
  const bubbleSide = isMe ? "chat-end" : "chat-start";
  const displayName = isMe ? session.Username : senderName;
  const initial = displayName[0]?.toUpperCase() || "?";

  return `
    <div class="chat ${bubbleSide}">
      <div class="chat-image avatar">
        <div class="w-10 rounded-full">
          <div class="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
            <span class="font-medium text-gray-600 dark:text-gray-300">${initial}</span>
          </div>
        </div>
      </div>
      <div class="chat-header">
        ${displayName}
        <time class="text-xs opacity-50">${msg.created_at?.slice(0, 16).replace("T", " ")}</time>
      </div>
      <div class="chat-bubble ${isMe ? "bg-base-200 text-black" : "bg-base-200 text-black"}" style="
        word-break: break-word;
        overflow-wrap: break-word;
        overflow-x: hidden;">
        ${msg.text}
      </div>
      <div class="chat-footer opacity-50">
        ${isMe ? "Seen" : "Delivered"}
      </div>
    </div>
  `;
}


// export function sendGroupMessageToSocket(text: string): void {
//   if (!text.trim()) return;
//   const selectedGroupId = getSelectedGroupId();
//   if (socket && socket.readyState === WebSocket.OPEN) {
//     const payload = {
//       type: "group-chat",
//       group_id: selectedGroupId,
//       text: text.trim(),
//     };
//     socket.send(JSON.stringify(payload));
//   } else {
//     console.warn("WebSocket is not connected.");
//     return;
//   }
// }
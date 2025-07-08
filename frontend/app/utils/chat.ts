
import { session } from "./session";
import { getChatMessages } from "../api";
import { getSelectedUserId } from "./store";
import { showToastU } from "./toast";


type ChatMessage = {
	sender_id: number;
	text: string;
	created_at: string;
};

export function appendChatMessage(msg: ChatMessage, partnerName: string): void {
	const userId = getSelectedUserId();

	if (msg.sender_id !== userId && msg.sender_id !== session.UserID) {
      console.log("a toast here");
      showToastU(`New message from "${partnerName}"`);
      return;
  }
    


	const isMe = msg.sender_id === session.UserID;
	const bubbleSide = isMe ? "chat-end" : "chat-start";
	const displayName = isMe ? session.Username : partnerName;
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

export async function loadChatHistory(user1: number, user2: number, partnerName: string, limit = 10, offset = 0) {
	try {
		const messages: ChatMessage[] = await getChatMessages(user1, user2, limit, offset);

		const chatBox = document.getElementById("chat-messages");
		if (!chatBox) return;
		if (offset === 0) {
			chatBox.innerHTML = ""; 
		}

		messages.reverse().forEach((msg) => {
			const wrapper = document.createElement("div");
			wrapper.innerHTML = createChatMessageHTML(msg, partnerName);
			chatBox.prepend(wrapper.firstElementChild!);
		});
	} catch (error) {
		console.error("Failed to load chat history:", error);
	}
}

function createChatMessageHTML(msg: ChatMessage, partnerName: string): string {
	const isMe = msg.sender_id === session.UserID;
	const bubbleSide = isMe ? "chat-end" : "chat-start";
	const displayName = isMe ? session.Username : partnerName;
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



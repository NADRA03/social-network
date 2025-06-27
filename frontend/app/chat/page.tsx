'use client';

import axios from 'axios';
import { useRouter } from 'next/navigation';
import '../output.css';
import { connectWebSocket } from "../api";
import { useEffect, useState, useRef } from "react";
import { socket } from "../api";
import { session } from '../utils/session';
import { appendChatMessage } from '../utils/chat';
import { loadChatHistory } from '../utils/chat';

type User = {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
  last_message_time: string;
  last_message_text: string;
  last_message_from: number | null;
  last_message_owner: "incoming" | "outgoing";
};

export default function ChatPage() {
  const [showPopover, setShowPopover] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [onlineIDs, setOnlineIDs] = useState<number[]>([]);  
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [partner, setPartner] = useState<string | null>(null);
  let offset = 0;
    const limit = 10;

  useEffect(() => {
    connectWebSocket((event) => {
      const data = JSON.parse(event.data);
      if (data.type !== "userlist") return;

      const container = containerRef.current;
      if (!container) return;

      container.innerHTML = ""; 

      data.users.forEach((user: any) => {
        const wrapper = document.createElement("div");
        wrapper.className = "flex items-center gap-4 mb-4";

        const avatarStatus = data.online.includes(user.ID) ? "avatar-online" : "avatar-offline";
        const avatarUrl = user.ImageURL || "https://img.daisyui.com/images/profile/demo/gordon@192.webp";

        wrapper.innerHTML = `
          <div class="avatar ${avatarStatus}">
            <div class="w-12 rounded-full">
              <img src="${avatarUrl}" />
            </div>
          </div>
          <div class="text-sm">${user.Username}</div>
        `;

        container.appendChild(wrapper);

        wrapper.addEventListener("click", () => {
          setSelectedUserId(user.ID);
          setPartner(user.Username);
        });

        container.appendChild(wrapper);
      });
    });
  }, []);
  

  useEffect(() => {
  if (!selectedUserId) return;

  offset = 0;
  partner && loadChatHistory(session.UserID, selectedUserId, partner, limit, offset);

  const chatForm = document.getElementById("chat-form");
  const input = document.getElementById("default-search") as HTMLInputElement;

  const handler = (e: Event) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    if (text.length > 200) {
      // showToast("Message is too long. Maximum 200 characters.");
      return;
    }

    sendMessageToSocket(text);
    input.value = "";
  };

  chatForm?.addEventListener("submit", handler);
  return () => {
    chatForm?.removeEventListener("submit", handler);
  };
}, [selectedUserId]);


function sendMessageToSocket(text: string): void {
	if (!text.trim()) return;

	if (socket && socket.readyState === WebSocket.OPEN) {
		const payload = {
			type: "chat",
			to: selectedUserId,
			text: text.trim(),
		};
		socket.send(JSON.stringify(payload));
	} else {
		console.warn("WebSocket is not connected.");
		return;
	}

	partner && appendChatMessage(
		{
			sender_id: session.UserID,
			text: text.trim(),
			created_at: new Date().toISOString(),
		},
		partner
	);

	offset++;
}

useEffect(() => {
  if (!selectedUserId) return;

  const chatBox = document.getElementById("chat-messages");
  if (!chatBox) return;

  const onScroll = async () => {
    if (chatBox.scrollTop === 0) {
      offset += limit;
      const previousHeight = chatBox.scrollHeight;
      console.log("here"); 
      if (partner) {
        await loadChatHistory(session.UserID, selectedUserId, partner, limit, offset);
        const newHeight = chatBox.scrollHeight;
        chatBox.scrollTop = newHeight - previousHeight;
      }
    }
  };

  chatBox.addEventListener("scroll", onScroll);

  return () => {
    chatBox.removeEventListener("scroll", onScroll);
  };
}, [selectedUserId]);

return (
<main className="h-screen overflow-hidden">





<div className="flex h-full">
{/* Sidebar */}
<div className=" w-1/5 h-full flex flex-col pl-10 pt-5 overflow-hidden">
  <div ref={containerRef}></div>
</div>


<div className="divider divider-horizontal"></div>


{/* Chat panel */}
<div id="chat" className="h-full w-1/3 relative flex flex-col overflow-hidden">
  {selectedUserId === null ? (
    <div className="text-gray-500 text-center mt-20 text-xl">
      👋 Select a user to start chatting
    </div>
  ) : (
    <>
      {/* Message List */}
      <div id="chat-messages" className="flex-1 overflow-y-auto p-4 space-y-3">
      </div>

      {/* Message Input */}
      <form id="chat-form" className="p-4 border-t border-base-300 flex gap-2">
        <input
          id="default-search"
          type="text"
          className="input input-bordered flex-1"
          placeholder="Type your message..."
          maxLength={200}
        />
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
    </>
  )}
</div>

  <div className="divider divider-horizontal"></div>
  <div className="overflow-hidden bg-base-300 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 w-3/7 min-h-screen">


    <div className="relative z-10 inline-block text-sm text-gray-900 dark:text-gray-400 w-full">
      <div className="p-3">
        <div className="flex">
          <div className="me-3 shrink-0">
            <a href="#" className="block p-2 bg-gray-100 rounded-lg dark:bg-gray-700">
              <img
                className="w-8 h-8 rounded-full"
                src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                alt="Flowbite logo"
              />
            </a>
          </div>
          <div>
            <p className="mb-1 text-base font-semibold leading-none text-gray-900 dark:text-white">
              <a href="#" className="hover:underline">Flowbite</a>
            </p>
            <p className="mb-3 text-sm font-normal">Tech company</p>
            <p className="mb-4 text-sm">
              Open-source library of Tailwind CSS components and Figma design system.
            </p>

            <div className="flex mb-3 -space-x-3 rtl:space-x-reverse">
              <img
                className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800"
                src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                alt=""
              />
              <img
                className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800"
                src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                alt=""
              />
              <img
                className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800"
                src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
                alt=""
              />
              <a
                className="flex items-center justify-center w-10 h-10 text-xs font-medium text-white bg-gray-400 border-2 border-white rounded-full hover:bg-gray-500 dark:border-gray-800"
                href="#"
              >
                +3
              </a>
            </div>

            {/* <div className="flex items-center">

              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg shrink-0 focus:outline-none hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
              >
                <svg
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 16 3"
                >
                  <path d="M2 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6.041 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM14 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
                </svg>
              </button>



                    {open && (
        <div className="absolute right- mt-2 z-10 w-44 bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700">
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
            <li>
              <a
                href="#"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                Invite users
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
              >
                Settings
              </a>
            </li>
          </ul>
        </div>
      )}

            </div> */}
          </div>
        </div>
      </div>
    </div>


  </div>


</div>

    </main>
  );
}
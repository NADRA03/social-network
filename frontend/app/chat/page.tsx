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
import { BadgePlus, MessageSquareDashed, Users, UsersRound, Search } from 'lucide-react';
import GroupList from '../utils/groupList';
import { useGroupStore } from '../utils/store';
import { showToastU } from '../utils/toast';
import PostsSection from '../utils/postsSesction';
import EventsSection from '../utils/eventsSection';
import Details from '../utils/detailsSection';
import EmojiPicker from "emoji-picker-react";
import BottomLeftNavigation from '../utils/navigation';
import SearchList from '../utils/searchList';
import { MessageCircle, FileText, CalendarDays } from "lucide-react"


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
  const groupRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [onlineIDs, setOnlineIDs] = useState<number[]>([]);  
  const { selectedGroupId, setSelectedGroupId, selectedUserId, setSelectedUserId } = useGroupStore();
  const [partner, setPartner] = useState<string | null>(null);
  const [showDirect, setShowDirect] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "posts" | "events">("chat");
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const onEmojiClick = (emojiData: any) => {
  setMessage((prev) => prev + emojiData.emoji);
  };
  let offset = 0;
  const limit = 10;

useEffect(() => {
  if (!showDirect) return;

  const container = containerRef.current;
  if (!container) return;

  connectWebSocket((event) => {
    const data = JSON.parse(event.data);
    if (data.type !== "userlist") return;

    container.innerHTML = "";

    data.users.forEach((user: any) => {
      const wrapper = document.createElement("div");
      wrapper.className = "flex flex-col gap-1 p-2 pl-4 border-l-4 border-blue-600 bg-base-100 shadow-smhover:shadow-md hover:border-purple-600 transition-all";

      const avatarStatus = data.online.includes(user.ID) ? "avatar-online" : "avatar-offline";
      const avatarUrl = user.ImageURL || "https://img.daisyui.com/images/profile/demo/gordon@192.webp";

const lastMessage = user.LastMessageText?.String
  ? `<div class="text-xs text-gray-500 truncate">${user.LastMessageOwner === "outgoing" ? "You:" : ""} ${user.LastMessageText.String}</div>`
  : `<div class="text-xs text-gray-400 italic">No messages yet</div>`;

wrapper.innerHTML = `
  <div class="flex items-center gap-4 mb-4 cursor-pointer">
    <div class="relative w-10 h-10">
      ${
        user.ImageURL
          ? `<div class="w-10 h-10 rounded-full overflow-hidden shadow">
               <img src="${user.ImageURL}" class="w-full h-full object-cover" />
             </div>`
          : `<div class="w-10 h-10 rounded-full bg-white text-gray-600 flex items-center justify-center font-bold uppercase shadow text-base">
               ${user.Username?.charAt(0) || "?"}
             </div>`
      }
      <span class="absolute bottom-0 right-0 block w-3.5 h-3.5 rounded-full border-2 border-white ${
        data.online.includes(user.ID) ? "bg-green-500" : "bg-gray-400"
      }"></span>
    </div>
    <div class="flex flex-col">
      <div class="text-sm font-medium">${user.Username}</div>
      ${lastMessage}
    </div>
  </div>
`;
      wrapper.addEventListener("click", () => {
        setSelectedUserId(user.ID);
        setPartner(user.Username);
        setSelectedGroupId(null);
      });

      container.appendChild(wrapper);
    });
  });
}, [showDirect]);

useEffect(() => {
  const direct = containerRef.current;
  const group = groupRef.current;

  if (showDirect) {
    if (group) group.innerHTML = "";
  } else {
    if (direct) direct.innerHTML = "";
  }
}, [showDirect]);

useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
      setShowEmojiPicker(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

useEffect(() => {
  if (!selectedUserId) return;

  offset = 0;
  partner && loadChatHistory(session.UserID, selectedUserId, partner, limit, offset);

  const chatForm = document.getElementById("chat-form");

  const handler = (e: Event) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    if (text.length > 200) {
      showToastU("Message is too long. Maximum 200 characters.");
      return;
    }

    sendMessageToSocket(text);
    setMessage(""); 
  };

  chatForm?.addEventListener("submit", handler);
  return () => {
    chatForm?.removeEventListener("submit", handler);
  };
}, [selectedUserId, message]);


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
<div className="w-1/5 h-full flex flex-col pl-10 pt-5 overflow-hidden relative z-10 before:absolute before:inset-y-0 before:left-0 before:w-1/2 before:bg-gradient-to-r before:from-purple-600 before:to-transparent before:opacity-10 before:z-0">

<div className="flex justify-around border-b border-base-300 bg-white p-2">
  <button
    onClick={() => {
      setShowDirect(true);
      setShowSearch(false);
    }}
    className={`relative px-4 py-2 rounded-lg group transition hover:scale-105 ${
      showDirect && !showSearch
        ? "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 shadow-xl text-white"
        : "bg-gray-100 text-purple-600"
    }`}
  >
    <MessageSquareDashed className="w-5 h-5 mx-auto" />
    <span className="text-xs font-medium">Direct</span>
  </button>

  <button
    onClick={() => {
      setShowDirect(false);
      setShowSearch(false);
    }}
    className={`relative px-4 py-2 rounded-lg group transition hover:scale-105 ${
      !showDirect && !showSearch
        ? "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 shadow-xl text-white"
        : "bg-gray-100 text-purple-600"
    }`}
  >
    <UsersRound className="w-5 h-5 mx-auto" />
    <span className="text-xs font-medium">Groups</span>
  </button>

  <button
    onClick={() => {
      setShowSearch(true);
    }}
    className={`relative px-4 py-2 rounded-lg group transition hover:scale-105 ${
      showSearch
        ? "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 shadow-xl text-white"
        : "bg-gray-100 text-purple-600"
    }`}
  >
    <Search className="w-5 h-5 mx-auto" />
    <span className="text-xs font-medium">Explore</span>
  </button>
</div>

      {showSearch ? (
        <SearchList />
      ) : showDirect ? (
        <div ref={containerRef} className="mt-6"></div>
      ) : (
        <GroupList />
      )}
</div>


<div className="divider divider-horizontal"></div>

<div id="chat"
  className="relative h-screen w-1/3 flex flex-col pt-5 overflow-hidden"
>
  {activeTab === "chat" && (
    <div
      className="absolute inset-0 z-0"
      style={{
        backgroundImage: `url('bg.png')`,
        backgroundRepeat: "repeat",
        backgroundSize: "contain",
      }}
    ></div>
  )}

  {(selectedUserId === null && selectedGroupId === null) || activeTab !== "chat" ? (
    <div
      className="absolute inset-0 z-0"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, #faf5ff, #f8f5ff, #fefcff)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    ></div>
  ) : null}

  {selectedUserId === null && selectedGroupId === null ? (
    <div className="flex items-center justify-center flex-col mt-80 text-center text-gray-500">
  <div className="flex flex-col items-center justify-center h-full text-gray-600 z-10">
    {/* <MessageCircle className="w-12 h-12 text-purple-500 animate-bounce" /> */}
    <p className="mt-4 text-lg font-medium text-purple-500">Select a user or group to start chatting!</p>
  </div>
    </div>
  ) : selectedGroupId !== null ? (
    <>
<div className="relative z-10 flex justify-around border-b border-base-300 p-2">
  <button
    className={`relative z-10 flex flex-col items-center gap-1 px-4 py-2 rounded-lg group transition hover:scale-105 ${
      activeTab === "chat"
        ? "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 shadow-md text-white"
        : "bg-gray-100 text-purple-600"
    }`}
    onClick={() => setActiveTab("chat")}
  >
    <MessageCircle className="w-5 h-5" />
    <span className="text-xs font-medium">Chat</span>
  </button>

  <button
    className={`relative z-10 flex flex-col items-center gap-1 px-4 py-2 rounded-lg group transition hover:scale-105 ${
      activeTab === "posts"
        ? "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 shadow-md text-white"
        : "bg-gray-100 text-purple-600"
    }`}
    onClick={() => setActiveTab("posts")}
  >
    <FileText className="w-5 h-5" />
    <span className="text-xs font-medium">Posts</span>
  </button>

  <button
    className={`relative z-10 flex flex-col items-center gap-1 px-4 py-2 rounded-lg group transition hover:scale-105 ${
      activeTab === "events"
        ? "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 shadow-md text-white"
        : "bg-gray-100 text-purple-600"
    }`}
    onClick={() => setActiveTab("events")}
  >
    <CalendarDays className="w-5 h-5" />
    <span className="text-xs font-medium">Events</span>
  </button>
</div>

  {/* Chat Section */}
  <div className={`${activeTab !== "chat" ? "hidden" : ""} flex flex-col flex-1 overflow-y-auto` }>
    <div id="chat-messages" className="flex-1 overflow-y-auto p-4 space-y-3"></div>

<form
  id="chat-form"
  style={{ position: "sticky", bottom: 0, background: "var(--b2)", zIndex: 10 }}
  className="p-4 border-t border-base-300 flex gap-2 items-end relative"
  onSubmit={(e) => e.preventDefault()}
>
<div ref={emojiRef} className="relative w-full flex gap-2 items-center">
  <button
    type="button"
    onClick={() => setShowEmojiPicker((prev) => !prev)}
    className="text-xl"
  >
    😊
  </button>

  <input
    id="default-search"
    type="text"
    className="input input-bordered flex-1 min-w-[150px] border-none outline-none focus:ring-0 focus:outline-none"
    placeholder="Type your message..."
    maxLength={200}
    value={message}
    onChange={(e) => setMessage(e.target.value)}
  />

  {showEmojiPicker && (
    <div className="absolute bottom-12 left-0 z-50">
      <EmojiPicker onEmojiClick={onEmojiClick} />
    </div>
  )}
</div>
<button
  type="submit"
  className="relative px-6 py-2 text-white font-medium group overflow-hidden rounded-md flex items-center justify-center"
>
  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
  <span className="relative z-10 text-center">Submit</span>
</button>
</form>
  </div>

  {/* Posts Section */}
  <div className={`${activeTab !== "posts" ? "hidden" : ""} flex-1 p-4 overflow-y-auto`}>
   <PostsSection/>
  </div>

  {/* Events Section */}
  <div className={`${activeTab !== "events" ? "hidden" : ""} flex-1 p-4 overflow-y-auto`}>
    <EventsSection/>
  </div>
    </>
  ) : (
    <>
      <div id="chat-messages" className="flex-1 overflow-y-auto p-4 space-y-3"></div>
<form
  id="chat-form"
  style={{ position: "sticky", bottom: 0, background: "var(--b2)", zIndex: 10 }}
  className="p-4 border-t border-base-300 flex gap-2 items-end relative"
  onSubmit={(e) => e.preventDefault()}
>
<div ref={emojiRef} className="relative w-full flex gap-2 items-center">
  <button
    type="button"
    onClick={() => setShowEmojiPicker((prev) => !prev)}
    className="text-xl"
  >
    😊
  </button>

  <input
    id="default-search"
    type="text"
    className="input input-bordered flex-1 min-w-[150px] border-none outline-none focus:ring-0 focus:outline-none"
    placeholder="Type your message..."
    maxLength={200}
    value={message}
    onChange={(e) => setMessage(e.target.value)}
  />

  {showEmojiPicker && (
    <div className="absolute bottom-12 left-0 z-50">
      <EmojiPicker onEmojiClick={onEmojiClick} />
    </div>
  )}
</div>
<button
  type="submit"
  className="relative px-6 py-2 text-white font-medium group overflow-hidden rounded-md flex items-center justify-center"
>
  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
  <span className="relative z-10 text-center">Submit</span>
</button>
</form>
    </>
  )}
</div>

  <div className="divider divider-horizontal"></div>
  <div className="overflow-hidden w-3/7 min-h-screen">


    <div id="details" className="h-full relative z-10 inline-block text-sm text-gray-900 dark:text-gray-400 w-full before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-purple-600 before:to-transparent before:opacity-20 before:z-0">
    <Details />
    </div>


  </div>


</div>
          <BottomLeftNavigation />
    </main>
    
  );
}
import { BadgePlus, X, Users, SquarePlus  } from "lucide-react";
import { createGroup, searchUsers, joinGroup} from "../api";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import '../output.css';
import { connectWebSocket } from "../api";
import { useEffect, useState, useRef } from "react";
import { socket } from "../api";
import { session } from './session';
import { appendChatMessage } from '../utils/chat';
import { loadChatHistory } from '../utils/chat';
import { useGroupStore } from "./store";
import { appendGroupChatMessage } from "./groupChat";
import { showToastU } from "./toast";
import { getGroupMembers } from "../api";
import { loadGroupChatHistory } from "./groupChat";
import { createNotification } from "../api";


export default function GroupList() {
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const groupContainerRef = useRef<HTMLDivElement | null>(null);
  const { selectedGroupId, setSelectedGroupId, selectedUserId, setSelectedUserId } = useGroupStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  let offset = 0;
  const limit = 10;
  let selectedGroupDetails: any = null;



  const handleSearch = (value: string) => {
    setSearch(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const users = await searchUsers(value);
      setResults(users);
    }, 300);
  };

const handleCreate = async () => {
  if (!groupName || selectedUsers.length === 0) return;

  const res = await createGroup({ name: groupName, description });
  const groupID = res.group_id;

  const currentUserID = session.UserID;

  for (const user of selectedUsers) {
    await createNotification({
      user_id: user.ID,
      inviter_id: currentUserID,
      group_id: groupID,
      type: "group_invite",
      message: `You’ve been invited to join the group "${groupName}"`,
      status: "unread",
    });
  }

  setGroupName("");
  setDescription("");
  setSelectedUsers([]);
  setShowForm(false);
  alert("Group created and invitations sent");
};

  const handleSelectUser = (user: any) => {
    if (!selectedUsers.find((u) => u.ID === user.ID)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (id: number) => {
    setSelectedUsers(selectedUsers.filter((u) => u.ID !== id));
  };

useEffect(() => {
  if (showForm) return; 

  const container = groupContainerRef.current;
  if (!container) return;

  connectWebSocket((event) => {
    const data = JSON.parse(event.data);

    if (data.type !== "grouplist") return;

    console.log(data)

    container.innerHTML = "";

    data.groups.forEach((group: any) => {
      const wrapper = document.createElement("div");
        wrapper.className = `
          flex flex-col gap-1 p-2 pl-4 border-l-4 border-blue-600 bg-base-100 shadow-sm
          hover:shadow-md hover:border-purple-600 transition-all
        `;

      const preview = group.LastMessage?.String
        ? `<div class="text-xs text-gray-500 truncate">${group.LastMessageOwner === "outgoing" ? "You:" : ""} ${group.LastMessage.String}</div>`
        : `<div class="text-xs text-gray-400 italic">No messages yet</div>`;

        wrapper.innerHTML = `
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <path d="M16 3.128a4 4 0 0 1 0 7.744"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div class="font-semibold text-base">${group.Name}</div>
          </div>
          ${preview}
        `;

      wrapper.addEventListener("click", () => {
        if (group.ID === useGroupStore.getState().selectedGroupId) {
          return; 
        }
        setSelectedGroupId(group.ID);
        setSelectedGroupName(group.Name);
        setSelectedUserId(null);

        const chatBox = document.getElementById("chat-messages");
        if (chatBox) chatBox.innerHTML = "";
      });
      

      container.appendChild(wrapper);
    });
  });
}, [showForm]); 


useEffect(() => {
  if (!selectedGroupId) return;

  let isMounted = true;
  offset = 0;

  const fetchAndLoadMembers = async () => {
    try {
      const details = await getGroupMembers(selectedGroupId);
      if (isMounted && details) {
        selectedGroupDetails = details;

        useGroupStore.getState().setSelectedGroupDetails(details)

        const membersMap: Record<number, string> = {};
        selectedGroupDetails.members.forEach((member: { ID: number; Username: string }) => {
          membersMap[member.ID] = member.Username;
        });

        console.log(selectedGroupDetails);

        loadGroupChatHistory(
          selectedGroupDetails.group_id,
          selectedGroupDetails.name,
          membersMap,
          10,
          0
        );
      }
    } catch (err) {
      console.error("Failed to load group members", err);
    }
  };
  fetchAndLoadMembers();

  const chatForm = document.getElementById("chat-form");
  const input = document.getElementById("default-search") as HTMLInputElement | null;
  if (!chatForm || !input) return;

  const handler = (e: Event) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    if (text.length > 200) {
      showToastU("Message is too long. Maximum 200 characters.");
      return;
    }

    sendGroupMessageToSocket(text);
    input.value = "";
  };

  chatForm.addEventListener("submit", handler);
  return () => {
    isMounted = false;
    chatForm.removeEventListener("submit", handler);
  };
}, [selectedGroupId]);


function sendGroupMessageToSocket(text: string): void {
  if (!text.trim()) return;
    console.log(selectedGroupId);
  if (socket && socket.readyState === WebSocket.OPEN) {
    const payload = {
      type: "group-chat",
      to: selectedGroupId,
      text: text.trim(),
    };
    socket.send(JSON.stringify(payload));
  } else {
    console.warn("WebSocket is not connected.");
    return;
  }

  appendGroupChatMessage(
    {
      sender_id: session.UserID,
      text: text.trim(),
      created_at: new Date().toISOString(),
      group_id: selectedGroupId,
    },
    session.Username, selectedGroupName
  );

  offset++;
}




  return (
    <div className="relative text-sm text-gray-500 px-2">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setShowForm(!showForm)}
      >
<SquarePlus
  className="w-10 h-10 absolute right-2 top-4 text-white bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-lg shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition"
/>
      </div>
      {!showForm && (
      <div ref={groupContainerRef} className="mt-16 space-y-2 max-h-full overflow-y-auto" />
      )}

      {showForm && (
        <div className="mt-24 relative bg-base-100 rounded-lg shadow-md border border-base-300 p-6 pt-8 space-y-4">
          <input
            className="input input-sm border-none outline-none focus:ring-0 focus:outline-none"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <input
            className="input input-sm border-none outline-none focus:ring-0 focus:outline-none"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.ID}
                  className="flex items-center gap-1 bg-base-200 px-2 py-1 rounded-full"
                >
                  <span>{user.Username}</span>
                  <X
                    className="w-4 h-4 cursor-pointer"
                    onClick={() => handleRemoveUser(user.ID)}
                  />
                </div>
              ))}
            </div>
          )}

          <input
            className="input input-sm border-none outline-none focus:ring-0 focus:outline-none"
            placeholder="Search users"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />

          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
          {results.map((user) => (
            <div
              key={user.ID}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-base-200 cursor-pointer"
              onClick={() => handleSelectUser(user)}
            >
              <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center text-xs font-semibold">
                {user.Username[0]?.toUpperCase()}
              </div>
              <span>{user.Username}</span>
            </div>
          ))}
          </div>

<div className="w-full flex justify-center">
  <button
    onClick={handleCreate}
    className="relative px-6 py-2 text-white font-medium group overflow-hidden rounded-md mt-2"
  >
    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
    <span className="relative z-10">Create Group</span>
  </button>
</div>

        </div>
      )}
    </div>
  );
}

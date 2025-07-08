"use client";

import { useState, useEffect } from "react";
import { useGroupStore } from "./store";
import { searchUsers, createNotification } from "../api";
import { Search, SquarePlus, TicketSlash } from "lucide-react";

export default function Details() {
  const { selectedGroupId, selectedGroupDetails } = useGroupStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteUI, setShowInviteUI] = useState(false);

  const existingUsernames = selectedGroupDetails?.members?.map((m: any) => m.Username) || [];

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const data: any[] = await searchUsers(query);
        const filtered = data.filter(
          (user) => !existingUsernames.includes(user.Username)
        );
        setResults(filtered);
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  if (!selectedGroupId || !selectedGroupDetails) {
    return <p className="p-4 text-gray-500"></p>;
  }

  const { name, description, members } = selectedGroupDetails;

  const handleInvite = async (userId: number, username: string) => {
    try {
      await createNotification({
        user_id: userId,
        inviter_id: members[0]?.ID || 0,
        group_id: selectedGroupId,
        type: "group_invite",
        message: `You've been invited to join the group "${name}"`,
        status: "unread",
      });
      alert(`Invitation sent to ${username}`);
    } catch (err) {
      console.error("Failed to send invite:", err);
      alert("Failed to send invite");
    }
  };

  return (
    <div className="relative space-y-6 p-4">
      <div className="p-6 shadow-lg space-y-2">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-sm font-medium tracking-wide">{name}</h2>
        </div>
        <p className="text-sm leading-relaxed">{description}</p>
      </div>

      <div className="bg-base-100 dark:bg-base-300 p-5 shadow-md border border-base-200">
        <ul className="divide-y divide-base-300">
          {members.map((member: any) => (
            <li key={member.ID} className="py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white text-gray-600 flex items-center justify-center font-bold uppercase shadow">
                {member.Username?.charAt(0) || "?"}
              </div>
              <span className="text-sm text-black">{member.Username || "Unnamed"}</span>
            </li>
          ))}
        </ul>
      </div>

       <div className="flex justify-end">
          <button
            onClick={() => setShowInviteUI((prev) => !prev)}
            className="w-10 h-10 text-white bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-lg shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition z-30"
            aria-label="Invite Users"
          >
            <TicketSlash className="w-full h-full" />
          </button>
        </div>

      {showInviteUI && (
        <div className="absolute right-6 top-90 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-80 z-40 p-4">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users to invite..."
              className="input input-sm outline-none focus:ring-0 focus:outline-none border w-full"
            />
            <Search className="w-5 h-5 text-gray-500" />
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Searching...</p>
          ) : results.length > 0 ? (
            <ul className="space-y-1 max-h-52 overflow-y-auto">
              {results.map((user) => (
                <li key={user.ID} className="flex items-center justify-between p-2">
                  <span className="text-sm">{user.Username}</span>
                  <button
                    onClick={() => handleInvite(user.ID, user.Username)}
                    className="relative px-4 py-1.5 text-white text-xs font-medium group overflow-hidden rounded-md"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
                    <span className="relative z-10">Invite</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() !== "" ? (
            <p className="text-sm italic text-gray-400">No users found</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

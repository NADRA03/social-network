"use client";

import { useState, useEffect } from "react";
import { searchGroups, createNotification } from "../api";
import { Search } from "lucide-react";
import { session } from "./session";

type Group = {
  id: number;
  name: string;
  description: string;
  is_member: boolean;
  creator_id: number;
};

export default function SearchList() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const data: Group[] = await searchGroups(query);
        setResults(data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleJoinRequest = async (group: Group) => {
    try {
      await createNotification({
        user_id: group.creator_id,
        inviter_id: session.UserID, 
        group_id: group.id,
        type: "join_request",
        message: `"${session.Username}" has requested to join your group "${group.name}".`,
        status: "unread",
      });
      alert("Join request sent!");
    } catch (err) {
      console.error("Failed to send join request:", err);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search groups..."
          className="input input-bordered flex-1 min-w-[150px] border-none outline-none focus:ring-0 focus:outline-none bg-purple-1 rounded-none"
        />
        <Search className="w-6 h-6 text-gray-400" />
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Searching...</p>
      ) : Array.isArray(results) && results.length > 0 ? (
        <ul className="space-y-3">
          {results.map((group) => (
            <li
              key={group.id}
              className="flex flex-col gap-1 p-2 pl-4 border-l-4 border-blue-600 bg-base-100 shadow-sm hover:shadow-md hover:border-purple-600 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </div>
                {group.is_member ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                    Member
                  </span>
                ) : (
                  <button
                    onClick={() => handleJoinRequest(group)}
                    className="text-xs px-2 py-1 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                  >
                    Request to Join
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : query.trim().length > 0 ? (
        <p className="text-gray-400 text-sm italic">No groups found</p>
      ) : null}
    </div>
  );
}

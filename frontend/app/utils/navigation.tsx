"use client";

import { useState, useRef, useEffect } from "react";
import { Home, Bell, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { connectWebSocket } from "../api"; 
import { joinGroup } from "../api";
import { updateNotificationStatus } from "../api";
import { setNotificationUpdater } from "./notifications";
import { markAllNotificationsAsRead } from "../api";
import { acceptFollowRequest } from "../api";
import { showToastU } from "./toast";
import { useSessionStore } from "./store";


type Notification = {
  id: number;
  user_id: number;
  inviter_id: number;
  group_id?: number;
  event_id?: number;
  type: string;
  message: string;
  status: string;
  created_at: string;
  read: number;
};

export default function BottomLeftNavigation() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMounted = useRef(false);
  const initialNotificationIDs = useRef<Set<number>>(new Set());
  const didInit = useRef(false);
  const session = useSessionStore((s) => s.session);



useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setShowNotifications(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

useEffect(() => {
  setNotificationUpdater((newNotifications: Notification[]) => {
    const unread = newNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);

    if (!didInit.current) {
      initialNotificationIDs.current = new Set(newNotifications.map(n => n.id));
      setNotifications(newNotifications);
      didInit.current = true;
      return;
    }

   
    const previous = initialNotificationIDs.current;
    const newUnread = newNotifications.filter(n => !n.read && !previous.has(n.id));

    newUnread.forEach(n => showToastU(n.message));

    setNotifications(newNotifications);
    newNotifications.forEach(n => previous.add(n.id)); 
  });
if (
  (window.location.pathname === "/" || window.location.pathname.startsWith("/profile"))
) {
  connectWebSocket(() => {});
}
}, []);

function handleNotificationResponse(id: number, action: "accepted" | "rejected") {
  const notif = notifications.find((n) => n.id === id);
  if (!notif) return;

  console.log(`Notification ${id} was ${action}`);

  updateNotificationStatus(id, action)
    .then(() => {
      console.log(`Notification ${id} status updated to ${action}`);

      if (
        action === "accepted"
      ) {
        if (
          notif.group_id &&
          ["group_invite", "join_request"].includes(notif.type)
        ) {
          const user_id =
            notif.type === "group_invite" ? session.UserID : notif.inviter_id;
          return joinGroup(notif.group_id, user_id)
            .then(() => {
              console.log(`Joined group ${notif.group_id}`);
            })
            .catch((err) => {
              console.error("Failed to join group, but status updated:", err);
            });
        }

        if (notif.type === "follow_request") {
          return acceptFollowRequest(notif.inviter_id)
            .then(() => {
              console.log(`Accepted follow request from ${notif.inviter_id}`);
            })
            .catch((err) => {
              console.error("Failed to accept follow request:", err);
            });
        }
      }
    })
    .finally(() => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: action } : n
        )
      );
    });
}

  return (
    <div className="fixed bottom-8 left-8 z-50 flex flex-col gap-4 items-start">
    {/* Home */}
  <Link href="/" className="group">
    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-full shadow-md hover:shadow-purple-500/40 hover:scale-105 transition">
      <Home className="w-full h-full text-white" />
    </div>
  </Link>

    {/* Profile */}
    <Link href={`/profile/${session?.UserID}`} className="group">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-full shadow-md hover:shadow-purple-500/40 hover:scale-105 transition">
        <User className="w-full h-full text-white" />
      </div>
    </Link>

    {/* Messages */}
  <Link href="/chat" className="group">
    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-full shadow-md hover:shadow-purple-500/40 hover:scale-105 transition">
      <MessageSquare className="w-full h-full text-white" />
    </div>
  </Link>

      <div className="relative" ref={panelRef}>
    <button
      onClick={() => {
        setShowNotifications(prev => {
          const newState = !prev;
          if (newState) {
            markAllNotificationsAsRead().then(() => {
              setUnreadCount(0);
              setNotifications(prev => prev.map(n => ({ ...n, read: 1 })));
            });
          }
          return newState;
        });
      }}
      className="relative w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-full shadow-md hover:shadow-purple-500/40 hover:scale-105 transition"
    >
      <Bell className="w-full h-full text-white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </button>

        {showNotifications && (
<div className="absolute left-14 bottom-0 mb-1 w-64 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg p-3 space-y-2 z-50">
  {notifications.length > 0 ? (
    [...notifications].reverse().map((notif) => {
      const createdAt = new Date(notif.created_at);
      const now = new Date();

      const isToday =
        createdAt.getDate() === now.getDate() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear();

      const timeOrDate = isToday
        ? createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : createdAt.toLocaleDateString([], { month: "short", day: "numeric" });

      return (
        <div
          key={notif.id}
          className="text-sm text-gray-700 hover:text-purple-700 transition flex justify-between items-start gap-2"
        >
          <div className="flex-1">
            <div>{notif.message}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{timeOrDate}</div>
          </div>

          {["follow_request", "group_invite", "join_request"].includes(notif.type) ? (
            notif.status === "unread" ? (
              <div className="flex gap-1">
                <button
                  onClick={() => handleNotificationResponse(notif.id, "accepted")}
                  className="text-green-600 text-xs border border-green-500 px-2 py-0.5 rounded hover:bg-green-100"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleNotificationResponse(notif.id, "rejected")}
                  className="text-red-600 text-xs border border-red-500 px-2 py-0.5 rounded hover:bg-red-100"
                >
                  Reject
                </button>
              </div>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 capitalize">
                {notif.status}
              </span>
            )
          ) : null}
        </div>
      );
    })
  ) : (
    <div className="text-sm text-gray-500 italic">No notifications</div>
  )}
</div>
        )}
      </div>
    </div>
  );
}

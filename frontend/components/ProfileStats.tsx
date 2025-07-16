"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, StickyNote, Eye, X } from "lucide-react";
import { useState } from "react";
import { getFollowGraph } from "@/app/api";
import Link from "next/link";

interface UserCard {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

interface ProfileStatsProps {
  userId: number;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isPrivate: boolean;
}

export const ProfileStats = ({
  userId,
  isPrivate,
  followerCount,
  followingCount,
  postCount,
}: ProfileStatsProps) => {
  const [openType, setOpenType] = useState<"followers" | "following" | null>(null);
  const [followers, setFollowers] = useState<UserCard[]>([]);
  const [following, setFollowing] = useState<UserCard[]>([]);

  const fetchGraph = async () => {
    try {
      const res = await getFollowGraph(userId);
      setFollowers(res.followers || []);
      setFollowing(res.following || []);
    } catch (err) {
      console.error("Failed to load follow graph", err);
      setFollowers([]);
      setFollowing([]);
    }
  };

  const handleOpen = async (type: "followers" | "following") => {
    setOpenType(type);
    await fetchGraph();
  };

  const handleClose = () => {
    setOpenType(null);
  };

  const stats = [
    {
      icon: Users,
      label: "Followers",
      value: followerCount,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => handleOpen("followers"),
    },
    {
      icon: Users,
      label: "Followings",
      value: followingCount,
      color: "text-green-600",
      bgColor: "bg-green-50",
      onClick: () => handleOpen("following"),
    },
    {
      icon: StickyNote,
      label: "No. of Posts",
      value: postCount,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      icon: Eye,
      label: "User Privacy",
      value: isPrivate ? "Private" : "Public",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const renderUsers = (users: UserCard[], title: string) => (
    <div className="fixed top-30 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl w-[90%] max-w-2xl max-h-[70vh] overflow-y-auto border border-transparent">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r rounded-t-xl flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button onClick={handleClose} className="text-gray-400 hover:text-red-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        {users.length === 0 ? (
          <p className="text-gray-500 text-center">No users found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map((u) => (
            <Link href={`/profile/${u.id}`} key={u.id}>
              <Card
                className="cursor-pointer flex items-center gap-4 bg-gradient-to-br from-white via-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 p-4 hover:bg-gray-100"
              >
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt={u.username}
                    className="w-12 h-12 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-300 text-white flex items-center justify-center font-bold uppercase shadow-inner">
                    {u.username?.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 leading-tight">
                    {u.first_name} {u.last_name}
                  </span>
                  <span className="text-sm text-gray-500">@{u.username}</span>
                </div>
              </Card>
            </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            onClick={stat.onClick}
            className="bg-white/90 cursor-pointer backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <CardContent className="p-6 text-center">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-3`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {openType === "followers" && renderUsers(followers, "Followers")}
      {openType === "following" && renderUsers(following, "Following")}
    </div>
  );
};

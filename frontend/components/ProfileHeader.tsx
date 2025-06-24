"use client";

import { useState } from "react";
import axios from "axios";
import { Camera, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  name: string;
  title: string;
  email: string;
  joinDate: string;
  avatarUrl: string;
  isOwner: boolean;
  isPrivate?: boolean;
  userId?: number;
  isFollowing?: boolean;
}

export const ProfileHeader = ({
  name,
  title,
  email,
  joinDate,
  avatarUrl,
  isOwner,
  isPrivate = false,
  userId,
  isFollowing = false,
}: ProfileHeaderProps) => {
  const [privateStatus, setPrivateStatus] = useState(isPrivate);
  const [following, setFollowing] = useState(isFollowing);

  const togglePrivacy = () => {
    // Ideally call backend here
    setPrivateStatus((prev) => !prev);
  };

  const toggleFollow = async () => {
    try {
      if (following) {
        await axios.delete(`http://localhost:8080/unfollow/${userId}`, {
          withCredentials: true,
        });
      } else {
        await axios.post(
          `http://localhost:8080/follow/${userId}`,
          {},
          { withCredentials: true }
        );
      }
      setFollowing((prev) => !prev);
    } catch (err) {
      console.error("Failed to follow/unfollow", err);
    }
  };
  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8">
          <div className="relative group">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white/30 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-4xl font-bold shadow-2xl">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              )}
            </div>
            <Button
              size="sm"
              className="absolute bottom-2 right-2 rounded-full p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {name}
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-4 font-light">
              {title}
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {joinDate}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {isOwner ? (
              <>
                <Button className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6">
                  Edit Profile
                </Button>
                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6"
                  onClick={togglePrivacy}
                >
                  {privateStatus ? "Make Public" : "Make Private"}
                </Button>
              </>
            ) : userId ? (
              <Button
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6"
                onClick={toggleFollow}
              >
                {following ? "Unfollow" : "Follow"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

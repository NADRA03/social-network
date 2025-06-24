"use client";

import { useState } from "react";
import axios from "axios";

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
}

export default function FollowButton({ userId, isFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (following) {
        await axios.delete(`http://localhost:8080/unfollow/${userId}`, {
          withCredentials: true,
        });
      } else {
        await axios.post(`http://localhost:8080/follow/${userId}`, null, {
          withCredentials: true,
        });
      }
      setFollowing(!following);
    } catch (err) {
      console.error("Failed to toggle follow", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-2 rounded text-white ${
        following ? "bg-red-500" : "bg-blue-500"
      }`}
    >
      {loading ? "..." : following ? "Unfollow" : "Follow"}
    </button>
  );
}

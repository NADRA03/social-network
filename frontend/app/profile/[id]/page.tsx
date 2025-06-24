"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileStats } from "@/components/ProfileStats";
import { ProfileTabs } from "@/components/ProfileTabs";
import AMPMToggle from "@/components/AMPMToggle";

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        if (!id || id === "me") {
          res = await axios.get(`http://localhost:8080/profile/me`, {
            withCredentials: true,
          });
        } else {
          res = await axios.get(`http://localhost:8080/users/${id}`, {
            withCredentials: true,
          });
        }

        setProfile(res.data);
      } catch (err) {
        console.error("Profile fetch failed:", err);
        setError("You are not authorized to view this profile.");
      }
    };

    fetchProfile();
  }, [id]);

  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (!profile) return <p className="p-4">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <AMPMToggle />

      <ProfileHeader
        name={profile.username}
        title={profile.title || "Member"}
        email={profile.email}
        joinDate={profile.joinDate || ""}
        avatarUrl={profile.avatar || ""}
        isOwner={profile.is_owner}
        isPrivate={profile.is_private}
        userId={profile.user_id}
        isFollowing={profile.is_following || false}
      />

      <ProfileStats
        isPrivate={profile.is_private}
        followerCount={profile.follower_count}
        followingCount={profile.following_count}
        postCount={profile.post_count}
      />
      <ProfileTabs
        // isPrivate={profile.is_private}
        // isOwner={profile.is_owner}
        // isFollowing={profile.is_following}
        canViewContent={profile.can_view_content}
      />
    </div>
  );
};

export default Profile;

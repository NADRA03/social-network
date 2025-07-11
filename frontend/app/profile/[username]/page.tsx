"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import axios from "axios";

import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileStats } from "@/components/ProfileStats";
import { ProfileTabs } from "@/components/ProfileTabs";
import AMPMToggle from "@/components/AMPMToggle";

const Profile = () => {
  // const { params } = useParams();
  const { id } = useParams();
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      try {
        let res;
        res = await axios.get(`http://localhost:8080/users/${username}`, {
          withCredentials: true,
        });

        setProfile(res.data);
      } catch (err) {
        console.error("Profile fetch failed:", err);
        setError("You are not authorized to view this profile.");
      }
    };

    fetchProfile();
  }, [username]);

  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (!profile) return <p className="p-4">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">

      <ProfileHeader
        name={profile.username}
        bio={profile.bio || " "}
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

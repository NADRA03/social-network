"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileStats } from "@/components/ProfileStats";
import { ProfileTabs } from "@/components/ProfileTabs";
import AMPMToggle from "@/components/AMPMToggle";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let res;
        if (!id || id === "me") {
          res = await axios.get("http://localhost:8080/profile", {
            withCredentials: true,
          });
        } else {
          res = await axios.get(`http://localhost:8080/users/${id}`, {
            withCredentials: true,
          });
        }

        setProfile(res.data);
      } catch (err) {
        setError("You are not authorized to view this profile.");
      }
    };

    fetchProfile();
  }, [id]);

  if (error) return <p className="text-red-500 p-4">{error}</p>;
  if (!profile) return <p className="p-4">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top-right AM/PM toggle */}
      <AMPMToggle />

      {/* Main Profile Header */}
      <ProfileHeader
        name={profile.username}
        title={profile.title || "Member"}
        email={profile.email}
        joinDate={profile.joinDate || ""}
        avatarUrl={profile.avatar || ""}
      />

      {/* Optional Buttons (only for owner) */}
      {profile.is_owner && (
        <div className="flex gap-4 justify-end px-4 mt-2"></div>
      )}

      {/* Stats and Tabs */}
      <ProfileStats />
      <ProfileTabs />
    </div>
  );
};

export default Profile;

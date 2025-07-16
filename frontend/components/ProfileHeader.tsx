"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Camera, Mail, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { logout } from "@/app/utils/auth";

interface ProfileHeaderProps {
  id: number;
  username: string | null;
  fname: string;
  lname: string;
  bio: string;
  email: string;
  joinDate: string;
  avatarUrl: string;
  isOwner: boolean;
  isPrivate?: boolean;
  userId?: number;
}

interface Follower {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  display_identifier: string;
  avatar: string;
  is_close_friend: boolean;
}

export async function uploadProfilePicture(file: File): Promise<string | null> {
  const filePath = `profiles/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from("social")
    .upload(filePath, file);

  if (error) {
    console.error("Upload failed:", error.message);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from("social")
    .getPublicUrl(filePath);
  return publicUrlData?.publicUrl || null;
}

export const ProfileHeader = ({
  id,
  username,
  fname,
  lname,
  bio,
  email,
  joinDate,
  avatarUrl,
  isOwner,
  isPrivate = false,
  userId,
}: ProfileHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [privateStatus, setPrivateStatus] = useState(isPrivate);
  const [following, setFollowing] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [showCloseFriends, setShowCloseFriends] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOwner) {
      fetchInitialData();
    } else if (id) {
      checkFollowingStatus();
    }
  }, [id, isOwner]);

  const checkFollowingStatus = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/is-following/${id}`,
        { withCredentials: true }
      );
      setFollowing(response.data.isFollowing);
    } catch (err) {
      console.error("Failed to check following status", err);
    }
  };

  const getDisplayName = () => {
    return username ? username : `${fname} ${lname}`;
  };

  const togglePrivacy = async () => {
    try {
      await axios.patch(
        `http://localhost:8080/profile/privacy`,
        {},
        { withCredentials: true }
      );
      setPrivateStatus((prev) => !prev);
      window.location.reload();
    } catch (err) {
      console.error("Failed to toggle privacy", err);
    }
  };

  const toggleFollow = async () => {
    setIsLoading(true);
    try {
      if (following) {
        await axios.delete(`http://localhost:8080/unfollow/${id}`, {
          withCredentials: true,
        });
      } else {
        await axios.post(
          `http://localhost:8080/follow/${id}`,
          {},
          { withCredentials: true }
        );
      }
      setFollowing(!following);
      window.location.reload();
    } catch (err) {
      console.error("Failed to follow/unfollow", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const followersRes = await axios.get<Follower[] | null>(
        "http://localhost:8080/followers",
        { withCredentials: true }
      );

      setFollowers(followersRes.data === null ? [] : followersRes.data || []);
    } catch (err) {
      console.error("Failed to fetch followers:", err);
      setFollowers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCloseFriend = (id: number) => {
    setFollowers(
      followers.map((f) =>
        f.id === id ? { ...f, is_close_friend: !f.is_close_friend } : f
      )
    );
  };

  const handleSaveCloseFriends = async () => {
    setIsLoading(true);
    try {
      const closeFriendIds = followers
        .filter((f) => f.is_close_friend)
        .map((f) => f.id);

      await axios.patch(
        "http://localhost:8080/profile/close-friends",
        { friend_ids: closeFriendIds },
        { withCredentials: true }
      );
      setShowCloseFriends(false);
    } catch (err) {
      console.error("Failed to update close friends", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadProfilePicture(file);
    if (!imageUrl) return;

    try {
      await axios.patch(
        "http://localhost:8080/profile/avatar",
        { avatar: imageUrl },
        { withCredentials: true }
      );
      setCurrentAvatar(imageUrl);
    } catch (err) {
      console.error("Failed to update avatar in DB", err);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white overflow-hidden">
      {/* Background overlays */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>

      {/* Main content container */}
      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8">
          {/* Avatar section */}
          <div className="relative group">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white/30 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-4xl font-bold shadow-2xl">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={getDisplayName()}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {getDisplayName()
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              )}
            </div>
            {isOwner && (
              <div className="absolute bottom-2 right-2">
                <Button
                  size="sm"
                  className="rounded-full p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            )}
          </div>

          {/* Profile info section */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {getDisplayName()}
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 font-light">
                {bio}
              </p>
            </div>

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

          {/* Action buttons section */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3">
            {isOwner ? (
              <>
                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6"
                  onClick={() => {
                    fetchInitialData();
                    setShowCloseFriends(true);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Edit Close Friends"
                  )}
                </Button>

                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6"
                  onClick={togglePrivacy}
                  disabled={isLoading}
                >
                  {privateStatus ? "Make Public" : "Make Private"}
                </Button>

                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6"
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6"
                onClick={toggleFollow}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : following ? (
                  "Unfollow"
                ) : (
                  "Follow"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Close Friends Modal */}
        {showCloseFriends && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-xl">
              <h2 className="text-black font-semibold mb-4">
                Select Close Friends
              </h2>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                </div>
              ) : followers === null ? (
                <div className="text-center py-8 text-gray-500">
                  Could not load followers data
                </div>
              ) : followers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  You have no followers to select from
                  <div className="text-center pt-3">
                  <Button
                      variant="ghost"
                      onClick={() => setShowCloseFriends(false)}
                      className="text-black"
                    >
                      Exit
                    </Button>
                    </div>
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {followers.map((follower) => (
                      <label
                        key={follower.id}
                        className="flex items-center gap-2 text-black"
                      >
                        <input
                          type="checkbox"
                          checked={follower.is_close_friend}
                          onChange={() => toggleCloseFriend(follower.id)}
                        />
                        <div>
                          <div className="font-medium">{`${follower.first_name} ${follower.last_name}`}</div>
                          <div className="text-sm text-gray-500">
                            {follower.email}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end mt-4 gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setShowCloseFriends(false)}
                      className="text-black"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveCloseFriends}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

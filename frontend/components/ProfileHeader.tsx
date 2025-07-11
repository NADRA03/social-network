"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Camera, Mail, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface ProfileHeaderProps {
  name: string;
  bio: string;
  email: string;
  joinDate: string;
  avatarUrl: string;
  isOwner: boolean;
  isPrivate?: boolean;
  userId?: number;
  isFollowing?: boolean;
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
  name,
  bio,
  email,
  joinDate,
  avatarUrl,
  isOwner,
  isPrivate = false,
  userId,
  isFollowing = false,
}: ProfileHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [privateStatus, setPrivateStatus] = useState(isPrivate);
  const [following, setFollowing] = useState(isFollowing);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);

  const [showCloseFriends, setShowCloseFriends] = useState(false);
  const [followers, setFollowers] = useState<{ id: number; username: string }[]>([]);
  const [selectedFollowers, setSelectedFollowers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOwner) {
      fetchInitialData();
    }
  }, [isOwner]);

  const togglePrivacy = async () => {
    try {
      await axios.patch(`http://localhost:8080/profile/privacy`, {}, { withCredentials: true });
      setPrivateStatus((prev) => !prev);
    } catch (err) {
      console.error("Failed to toggle privacy", err);
    }
  };

  const toggleFollow = async () => {
    try {
      if (following) {
        await axios.delete(`http://localhost:8080/unfollow/${name}`, { withCredentials: true });
        setFollowing(false);
      } else {
        await axios.post(`http://localhost:8080/follow/${name}`, {}, { withCredentials: true });
        setFollowing(true);
      }
    } catch (err) {
      console.error("Failed to follow/unfollow", err);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [followersRes, closeFriendsRes] = await Promise.all([
        axios.get("http://localhost:8080/followers", { withCredentials: true }),
        axios.get("http://localhost:8080/profile/close-friends", { withCredentials: true }),
      ]);

      setFollowers(followersRes.data);
      
      const closeFriendsData = Array.isArray(closeFriendsRes?.data) 
        ? closeFriendsRes.data 
        : [];
      
      const ids = closeFriendsData.map(f => typeof f === 'object' ? f.id : f);
      setSelectedFollowers(ids);
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowersAndCloseFriends = async () => {
    await fetchInitialData();
  };

  const handleSaveCloseFriends = async () => {
    try {
      await axios.patch(
        "http://localhost:8080/profile/close-friends",
        { friend_ids: selectedFollowers },
        { withCredentials: true }
      );
      setShowCloseFriends(false);
      await fetchInitialData(); 
    } catch (err) {
      console.error("Failed to update close friends", err);
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
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8">
          <div className="relative group">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white/30 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-4xl font-bold shadow-2xl">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
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
            {isOwner && (
              <>
                <Button
                  size="sm"
                  className="absolute bottom-2 right-2 rounded-full p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
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
              </>
            )}
          </div>

          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {name}
            </h1>
            <p className="text-xl lg:text-2xl text-blue-100 mb-4 font-light">{bio}</p>
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
                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6"
                  onClick={() => {
                    fetchFollowersAndCloseFriends();
                    setShowCloseFriends(true);
                  }}
                >
                  Edit Close Friends
                </Button>

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
                      ) : (
                        <>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {followers.map((follower) => (
                              <label key={follower.id} className="flex items-center gap-2 text-black">
                                <input
                                  type="checkbox"
                                  checked={selectedFollowers.includes(follower.id)}
                                  onChange={(e) => {
                                    const id = follower.id;
                                    setSelectedFollowers(prev => 
                                      e.target.checked 
                                        ? [...prev, id] 
                                        : prev.filter(fid => fid !== id)
                                    );
                                  }}
                                />
                                <span>{follower.username}</span>
                              </label>
                            ))}
                          </div>

                          <div className="flex justify-end mt-4 gap-2 text-black">
                            <Button variant="ghost" onClick={() => setShowCloseFriends(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveCloseFriends}>
                              Save
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6"
                  onClick={togglePrivacy}
                >
                  {privateStatus ? "Make Public" : "Make Private"}
                </Button>
              </>
            ) : name ? (
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
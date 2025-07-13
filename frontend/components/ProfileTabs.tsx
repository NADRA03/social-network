import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";

interface ProfileTabsProps {
  canViewContent: boolean;
  userId: number;
}

enum postVisibility {
  Public = 0,
  FollowersOnly = 1,
  CloseFriends = 2,
}

interface Post {
  id: number;
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  image?: string;
  created_at: string;
  visibility: postVisibility;
}

export const ProfileTabs = ({ canViewContent, userId }: ProfileTabsProps) => {
  const isLocked = !canViewContent;
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    axios
      .get(`http://localhost:8080/profile/${userId}/posts`, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("API response:", res.data);

        if (res.data && res.data.status === "private") {
          setIsPrivate(true);
          setPosts([]);
        } else {
          const extractedPosts = Array.isArray(res.data.posts)
            ? res.data.posts
            : Array.isArray(res.data)
            ? res.data
            : [];

          setIsPrivate(false);
          setPosts(extractedPosts);
        }
      })
      .catch((err) => {
        console.error("Failed to load posts", err);
        setIsPrivate(false);
        setPosts([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Tabs defaultValue="posts" className="w-full">

        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                </div>
              ) : isLocked || isPrivate ? (
                <div className="flex flex-col items-center text-gray-500 py-12">
                  <Lock className="w-10 h-10 mb-4" />
                  <p>This profile is private.</p>
                </div>
              ) : (
                <div className="flex justify-center p-8">
                  <div className="w-full max-w-2xl">
                    {Array.isArray(posts) && posts.length > 0 ? (
                      posts.map((post) => (
                        <Card
                          key={post.id}
                          className="bg-white/70 backdrop-blur-md border-white/20 m-10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden group"
                          style={{
    wordBreak: "break-word",
    overflowWrap: "break-word",
    overflowX: "hidden",
  }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <img
                                src={
                                  post.avatar_url ||
                                  "https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                                }
                                alt="Profile"
                                className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-800">
                                      {post.display_name}
                                    </span>
                                    <span className="text-sm text-gray-500 bg-white/40 px-2 py-1 rounded-full backdrop-blur-sm">
                                      {new Date(
                                        post.created_at
                                      ).toLocaleString()}
                                    </span>
                                    {post.visibility === postVisibility.Public && (
                                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                        Public
                                      </span>
                                    )}
                                    {post.visibility ===
                                      postVisibility.FollowersOnly && (
                                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                        Followers Only
                                      </span>
                                    )}
                                    {post.visibility ===
                                      postVisibility.CloseFriends && (
                                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                        Close Friends
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <p className="text-gray-700 mb-4 text-base leading-relaxed">
                                  {post.content}
                                </p>

                                {post.image && (
                                  <div className="relative group/image mb-4">
                                    <img
                                      src={post.image}
                                      alt="Post content"
                                      className="w-full rounded-xl shadow-lg border border-white/20 transition-transform duration-300 group-hover/image:scale-[1.02]"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 text-lg">
                        No posts created yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

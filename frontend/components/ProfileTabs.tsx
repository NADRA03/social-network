import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";

interface ProfileTabsProps {
  canViewContent: boolean;
}

interface Post {
  id: number;
  username: string;
  avatar?: string;
  content: string;
  image?: string;
  time: string;
  created_at: string;
}

export const ProfileTabs = ({ canViewContent }: ProfileTabsProps) => {
  const isLocked = !canViewContent;

  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:8080/feed", { withCredentials: true })
      .then((res) => {
        console.log("Fetched posts:", res.data);
        setPosts(res.data);
      })
      .catch((err) => console.error("Failed to load posts", err));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="groups">Groups Joined</TabsTrigger>
          <TabsTrigger value="likes">Liked Posts</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLocked ? (
                <div className="flex flex-col items-center text-gray-500 py-12">
                  <Lock className="w-10 h-10 mb-4" />
                  <p>This profile is private.</p>
                </div>
              ) : (
                <div className="flex justify-center p-8">
                  <div className="w-full max-w-2xl">
                    {posts.map((post, index) => (
                      <Card
                        key={index}
                        className="mb-8 bg-white/60 backdrop-blur-md border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <img
                              src={
                                post.avatar ||
                                "https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                              }
                              alt="Profile"
                              className="w-12 h-12 rounded-full border-2 border-white/40 shadow-lg"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="font-semibold text-gray-800 text-lg">
                                  {post.username}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    post.created_at
                                  ).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-4 text-base">
                                {post.content}
                              </p>
                              {post.image && (
                                <div className="relative group">
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 to-purple-600/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="bg-white/40 hover:bg-white/60 text-white border border-white/30 shadow-lg"
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 16 18"
                                      >
                                        <path
                                          stroke="currentColor"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 1v11m0 0 4-4m-4 4L4 8m11 4v3a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-3"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                  <img
                                    src={post.image}
                                    alt="Post content"
                                    className="w-full max-w-sm rounded-xl shadow-lg border border-white/20"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {isLocked ? (
                <div className="flex flex-col items-center text-gray-500 py-12">
                  <Lock className="w-10 h-10 mb-4" />
                  <p>This profile is private.</p>
                </div>
              ) : (
                <p className="text-gray-500">No groups joined yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liked Posts Tab */}
        <TabsContent value="likes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Liked Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLocked ? (
                <div className="flex flex-col items-center text-gray-500 py-12">
                  <Lock className="w-10 h-10 mb-4" />
                  <p>This profile is private.</p>
                </div>
              ) : (
                <p className="text-gray-500">No liked posts yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLocked ? (
                <div className="flex flex-col items-center text-gray-500 py-12">
                  <Lock className="w-10 h-10 mb-4" />
                  <p>This profile is private.</p>
                </div>
              ) : (
                <p className="text-gray-500">No comments yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

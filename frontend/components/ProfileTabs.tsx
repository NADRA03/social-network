import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lock, Camera, Send, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface ProfileTabsProps {
  username: string;
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

interface Comment {
  id: number;
  username: string;
  content: string;
  image_url?: string;
  created_at: string;
}

async function uploadImageToSupabase(file: File): Promise<string | null> {
  const filePath = `comments/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from("social").upload(filePath, file);
  if (error) {
    console.error("Upload failed:", error);
    return null;
  }
  const { data: publicUrlData } = supabase.storage.from("social").getPublicUrl(filePath);
  return publicUrlData?.publicUrl || null;
}

export const ProfileTabs = ({ canViewContent, userId, username }: ProfileTabsProps) => {
  const isLocked = !canViewContent;
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    axios
      .get(`http://localhost:8080/profile/${userId}/posts`, {
        withCredentials: true,
      })
      .then((res) => {
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

  const handleCommentClick = (post: Post) => {
    setSelectedPost(post);
    setShowComments(true);
    fetchComments(post.id);
  };

  const fetchComments = async (postId: number) => {
    try {
      const res = await axios.get(`http://localhost:8080/comments?post_id=${postId}`, {
        withCredentials: true,
      });
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setComments([]);
    }
  };

  const submitComment = async () => {
    if (!commentContent.trim() && !commentImageFile) return;
    if (!selectedPost) return;

    try {
      let imageUrl: string | null = null;
      if (commentImageFile) {
        imageUrl = await uploadImageToSupabase(commentImageFile);
      }

      await axios.post(
        "http://localhost:8080/comment",
        {
          post_id: selectedPost.id,
          content: commentContent,
          image: imageUrl || undefined,
        },
        { withCredentials: true }
      );

      setCommentContent("");
      setCommentImageFile(null);
      setCommentImagePreview(null);
      fetchComments(selectedPost.id);
    } catch (err) {
      console.error("Failed to submit comment:", err);
    }
  };

  const handleCommentImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      alert("Only JPEG, PNG, and GIF images are allowed");
      return;
    }

    setCommentImageFile(file);
    setCommentImagePreview(URL.createObjectURL(file));
  };

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
                  <div className="w-full max-w-2xl space-y-6">
                    {Array.isArray(posts) && posts.length > 0 ? (
                      posts.map((post) => (
                        <Card
                          key={post.id}
                          className="bg-white/70 backdrop-blur-md border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden group"
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            overflowX: "hidden",
                          }}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                        {post.avatar_url ? (
                                          <img
                                            src={post.avatar_url}
                                            alt="Profile"
                                            className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg object-cover"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-semibold text-gray-700 dark:text-gray-200 cursor-pointer overflow-hidden">
                                            {username?.[0]?.toUpperCase() || "?"}
                                          </div>
                                        )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-800">{username}</span>
                                    <span className="text-sm text-gray-500 bg-white/40 px-2 py-1 rounded-full backdrop-blur-sm">
                                      {new Date(post.created_at).toLocaleString()}
                                    </span>
                                    {post.visibility === postVisibility.Public && (
                                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Public</span>
                                    )}
                                    {post.visibility === postVisibility.FollowersOnly && (
                                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Followers Only</span>
                                    )}
                                    {post.visibility === postVisibility.CloseFriends && (
                                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Close Friends</span>
                                    )}
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-4 text-base leading-relaxed">{post.content}</p>
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
                                <div className="flex justify-end">
                                      <button
                                        onClick={() => handleCommentClick(post)}
                                        className="relative px-4 py-1.5 text-sm text-white font-medium group overflow-hidden rounded-md"
                                      >
                                        <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
                                        <span className="relative z-10 flex items-center gap-2">
                                          <span>Comment</span>
                                        </span>
                                      </button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 text-lg">No posts created yet.</p>
                    )}
                  </div>
                </div>
              )}

              {showComments && selectedPost && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60 p-4">
                  <Card className="w-full max-w-2xl max-h-[90vh] bg-white/95 backdrop-blur-md border-white/20 shadow-3xl rounded-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                      <h3 className="text-xl font-bold text-gray-800">Comments</h3>
                      <Button
                        onClick={() => setShowComments(false)}
                        variant="ghost"
                        size="icon"
                        className="bg-white/30 hover:bg-white/50 rounded-full"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Original Post */}
                    <div className="p-6 border-b border-white/20 bg-white/30">
                      <div className="flex items-start gap-4">
                        {selectedPost.avatar_url ? (
                          <img
                            src={selectedPost.avatar_url}
                            alt="Profile"
                            className="w-12 h-12 rounded-full border-2 border-white/40 shadow-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-white/40 shadow-lg bg-gray-400 flex items-center justify-center text-white font-semibold text-lg">
                            {username?.[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-800">
                              {username}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(selectedPost.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p
                            className="text-gray-700"
                            style={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              overflowX: "hidden",
                            }}
                          >
                            {selectedPost.content}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-3 p-4 bg-white/40 rounded-xl backdrop-blur-sm"
                        >
                          <div className="w-12 h-12 rounded-full border-2 border-white/40 shadow-lg bg-gray-400 flex items-center justify-center text-white font-semibold text-lg">
                            {comment.username?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-800">
                                {comment.username}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p
                              className="text-gray-700 text-sm"
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                overflowX: "hidden",
                              }}
                            >
                              {comment.content}
                            </p>
                            {comment.image_url && (
                              <div className="mt-2">
                                <img
                                  src={comment.image_url}
                                  alt="Comment"
                                  className="max-h-40 rounded-md border border-gray-200"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Image Preview (outside scroll) */}
                    {commentImageFile && (
                      <div className="px-6">
                        <div className="relative mt-2">
                          <img
                            src={URL.createObjectURL(commentImageFile)}
                            alt="Comment preview"
                            className="max-h-40 rounded-md border border-gray-200"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                            onClick={() => setCommentImageFile(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Comment Input */}
                    <div className="p-6 border-t border-white/20 bg-white/30">
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          <Textarea
                            placeholder="Write a comment..."
                            rows={2}
                            className="flex-1 bg-white/50 border-white/30 focus:border-blue-500/50 rounded-xl resize-none"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                          />
                          {/* Camera Button */}
                          <button
                            type="button"
                            onClick={() => commentFileInputRef.current?.click()}
                            className="group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-full shadow-md hover:shadow-purple-500/40 hover:scale-105 transition flex items-center justify-center">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif"
                              ref={commentFileInputRef}
                              className="hidden"
                              onChange={handleCommentImageChange}
                            />
                          </button>

                          {/* Send Button */}
                          <button
                            type="submit"
                            onClick={submitComment}
                            className="group"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-full shadow-md hover:shadow-purple-500/40 hover:scale-105 transition flex items-center justify-center">
                              <Send className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

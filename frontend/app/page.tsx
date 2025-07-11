"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  House,
  MessageSquareMore,
  Bell,
  Search,
  Plus,
  Paperclip,
  Users,
  Camera,
  MessageCircle,
  X,
  Send,
  TrendingUp,
  Hash,
  Star,
  Heart,
  Share,
  Bookmark,
  MoreHorizontal,
  Earth,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

enum postVisibility {
  Public = 0,
  FollowersOnly = 1,
  CloseFriends = 2,
}

interface Post {
  id: number;
  username: string;
  avatar?: string;
  content: string;
  image?: string;
  created_at: string;
  visibility: postVisibility;
}

interface Comment {
  id: number;
  username: string;
  content: string;
  created_at: string;
}

export async function uploadImageToSupabase(
  file: File
): Promise<string | null> {
  const filePath = `posts/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from("social")
    .upload(filePath, file);

  if (error) {
    console.error("Upload failed:", error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from("social")
    .getPublicUrl(filePath);
  return publicUrlData?.publicUrl || null;
}

export default function Home() {
  const { username } = useParams();
  const [showForm, setShowForm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visibility, setVisibility] = useState(0);
  const [suggestedUsers, setSuggestedUsers] = useState<
    {
      id: number;
      name: string;
      username: string;
      avatar?: string;
    }[]
  >([]);

  // Fetch posts
  useEffect(() => {
    const loadData = async () => {
      // await fetchNonFollowedUsers();
      axios
      .get("http://localhost:8080/feed", { withCredentials: true })
      .then((res) => {
        console.log("Fetched posts:", res.data);
        console.log("Posts received from backend:", res.data);
        setPosts(res.data);
      })
      .catch((err) => console.error("Failed to load posts", err));
    };
    loadData();
  }, []);

  // Submit new post
  const handlePost = async () => {
    if (!content.trim()) return;

    let imageUrl: string | null = "";
    if (imageFile) {
      try {
        imageUrl = await uploadImageToSupabase(imageFile);
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }

    axios
      .post(
        "http://localhost:8080/post",
        { content, image: imageUrl || "", visibility },
        { withCredentials: true }
      )
      .then(() => {
        setContent("");
        setImageFile(null);
        setVisibility(0);
        setShowForm(false);
        return axios.get("http://localhost:8080/feed", {
          withCredentials: true,
        });
      })
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("Failed to create post", err));
  };

  //Upload images on posts
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      alert("Only jpeg, jpg, and gif types are allowed");
      return;
    }

    setImageFile(file);
  };

  // Handle comment popup
  const handleCommentClick = (post: Post) => {
    setSelectedPost(post);
    setShowComments(true);
    fetchComments(post.id);
  };

  const submitComment = async () => {
    if (!commentContent.trim() || !selectedPost) return;

    try {
      await axios.post(
        "http://localhost:8080/comment",
        {
          post_id: selectedPost.id,
          content: commentContent,
        },
        { withCredentials: true }
      );

      setCommentContent("");
      fetchComments(selectedPost.id);
    } catch (err) {
      console.error("Failed to submit comment:", err);
    }
  };

  // const fetchNonFollowedUsers = async () => {
  //   try {
  //     const response = await axios.get(
  //       "http://localhost:8080/users/not-followed",
  //       {
  //         withCredentials: true,
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     console.log("Suggested users response:", response.data); 
  //     setSuggestedUsers(response.data || []);
  //   } catch (err) {
  //     console.error("Failed to fetch suggested users:", err);
  //     setSuggestedUsers([]);
  //   }
  // };

  const fetchComments = async (postId: number) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/comments?post_id=${postId}`,
        { withCredentials: true }
      );
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load comments:", err);
      setComments([]);
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      await axios.post(
        `http://localhost:8080/follow/${userId}`,
        {},
        { withCredentials: true }
      );
      // fetchNonFollowedUsers();
    } catch (err) {
      console.error("Failed to follow user", err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      {/* Enhanced Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Social Network
            </h1>

            {/* Quick Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl px-4 py-2"
              >
                <House className="w-4 h-4" />
                Home
              </Button>
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:bg-white/50 rounded-xl px-4 py-2"
              >
                <MessageSquareMore className="w-4 h-4" />
                Messages
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Enhanced Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="search"
                placeholder="Search posts, users, topics..."
                className="pl-10 pr-4 py-2 w-80 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-sm transition-all duration-200"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white/90 backdrop-blur-md border-white/20"
              >
                <DropdownMenuItem>New follower: Sarah Chen</DropdownMenuItem>
                <DropdownMenuItem>Mike liked your post</DropdownMenuItem>
                <DropdownMenuItem>New comment on your post</DropdownMenuItem>
                <DropdownMenuItem>Mark all as read</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-0 bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl"
                >
                  <img
                    src="https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                    alt="Profile"
                    className="h-10 w-10 rounded-lg border-2 border-white/30"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white/90 backdrop-blur-md border-white/20"
              >
                <DropdownMenuItem>
                  <Link href={`/profile/${username}`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2 lg:col-start-2">
            <div className="space-y-6">

              {/* Posts Feed */}
              {Array.isArray(posts) && posts.length > 0 ? (
                posts.map((post, index) => (
                  <Card
                    key={index}
                    className="bg-white/70 backdrop-blur-md border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <img
                          src={
                            post.avatar ||
                            "https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                          }
                          alt="Profile"
                          className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-800">
                                {post.username}
                              </span>
                              <span className="text-sm text-gray-500 bg-white/40 px-2 py-1 rounded-full backdrop-blur-sm">
                                {new Date(post.created_at).toLocaleString()}
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
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-white/20">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleCommentClick(post)}
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 bg-white/30 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl px-4 py-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">Comment</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/70 backdrop-blur-md border-white/20 shadow-xl rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Welcome to Social Network!
                    </h3>
                    <p className="text-gray-500 mb-6">
                      No posts have been created yet.
                    </p>
                    <Button
                      onClick={() => setShowForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl"
                    >
                      Create Your First Post
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="hidden lg:block space-y-6">
            {/* Suggested Users */}
            {/* <Card className="bg-white/70 backdrop-blur-md border-white/20 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-800">
                    People You Might Know
                  </h3>
                </div>
                <div className="space-y-4">
                  {suggestedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 bg-white/40 rounded-xl hover:bg-white/60 transition-colors"
                    >
                      <img
                        src={
                          user.avatar ||
                          "https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                        }
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-white/50"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">
                          {user.username}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-3 py-1 rounded-lg"
                        onClick={() => handleFollow(user.id)}
                      >
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>

      {/* Comments Popup Modal */}
      {showComments && selectedPost && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] bg-white/95 backdrop-blur-md border-white/20 shadow-3xl rounded-2xl overflow-hidden">
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
                <img
                  src={
                    selectedPost.avatar ||
                    "https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                  }
                  alt="Profile"
                  className="w-12 h-12 rounded-full border-2 border-white/40 shadow-lg"
                />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-800">
                      {selectedPost.username}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(selectedPost.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{selectedPost.content}</p>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto max-h-96 p-6 space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 p-4 bg-white/40 rounded-xl backdrop-blur-sm"
                >
                  <img
                    src="https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                    alt="Profile"
                    className="w-10 h-10 rounded-full border-2 border-white/40 shadow-md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">
                        {comment.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Input */}
            <div className="p-6 border-t border-white/20 bg-white/30">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Write a comment..."
                  rows={2}
                  className="flex-1 bg-white/50 border-white/30 focus:border-blue-500/50 rounded-xl resize-none"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <Button
                  onClick={submitComment}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-xl px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Enhanced Post Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 bg-white/95 backdrop-blur-md border-white/20 shadow-3xl rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Create New Post
                </h3>
                <Button
                  onClick={() => setShowForm(false)}
                  variant="ghost"
                  size="icon"
                  className="bg-white/30 hover:bg-white/50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <img
                  src="https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                  alt="Your profile"
                  className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg"
                />
                <div className="flex-1">
                  <Textarea
                    placeholder="What's happening?"
                    rows={4}
                    className="w-full bg-white/50 border-white/30 focus:border-blue-500/50 rounded-xl resize-none text-lg"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>

              {imageFile && (
                <div className="mb-6 relative">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-full rounded-xl border border-white/20"
                  />
                  <Button
                    onClick={() => setImageFile(null)}
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/30 hover:bg-white/50 border border-white/20 rounded-xl"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/30 hover:bg-white/50 border border-white/20 rounded-xl"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setVisibility(0)}>
                        {visibility == 0 && <span className="mr-2">✓</span>}
                        <Earth /> Public
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setVisibility(1)}>
                        {visibility == 1 && <span className="mr-2">✓</span>}
                        <Users /> Followers Only
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setVisibility(2)}>
                        {visibility == 2 && <span className="mr-2">✓</span>}
                        <Star /> Close Friends
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button
                  onClick={handlePost}
                  disabled={!content.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg px-8 py-3 rounded-xl transition-all duration-200"
                >
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowForm(!showForm)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-40"
        size="icon"
      >
        <Plus className="w-7 h-7" />
      </Button>
    </main>
  );
}

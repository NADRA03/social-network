"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  House,
  MessageSquareMore,
  Bell,
  Search,
  Plus,
  Paperclip,
  MapPin,
  Camera,
  MessageCircle,
  X,
  Send,
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

interface Post {
  id: number;
  username: string;
  avatar?: string;
  content: string;
  image?: string;
  created_at: string;
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
  const [showForm, setShowForm] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch posts
  useEffect(() => {
    axios
      .get("http://localhost:8080/feed", { withCredentials: true })
      .then((res) => {
        console.log("Fetched posts:", res.data);
        console.log("Posts received from backend:", res.data);
        setPosts(res.data);
      })
      .catch((err) => console.error("Failed to load posts", err));
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
        { content, image: imageUrl || "" },
        { withCredentials: true }
      )
      .then(() => {
        setContent("");
        setImageFile(null);
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

  // Submit comment
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

  return (
    <main className="flex min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      {/* Navigation Bar with Gradient */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Social Network
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar with Modern Styling */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="search"
                placeholder="Search"
                className="pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent shadow-sm"
              />
            </div>

            {/* Notifications with Modern Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white/90 backdrop-blur-md border-white/20"
              >
                <DropdownMenuItem>Notifications</DropdownMenuItem>
                <DropdownMenuItem>Mark all as read</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Menu with Enhanced Styling */}
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
                <DropdownMenuItem>Home</DropdownMenuItem>
                <DropdownMenuItem>Dashboard</DropdownMenuItem>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex w-full pt-20">
        {/* Sidebar with Gradient */}
        <div className="w-64 h-screen bg-gradient-to-b from-white/40 to-white/20 backdrop-blur-md border-r border-white/20 fixed left-0 top-20 shadow-xl">
          <div className="p-6">
            <nav className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <House className="w-4 h-4 mr-3" />
                Home
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/20 text-gray-700"
              >
                <MessageSquareMore className="w-4 h-4 mr-3" />
                Dashboard
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/20 text-gray-700"
              >
                <svg
                  className="w-4 h-4 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                </svg>
                Profile
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/20 text-gray-700"
              >
                <svg
                  className="w-4 h-4 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M18 7.5h-.423l-.452-1.09.3-.3a1.5 1.5 0 0 0 0-2.121L16.01 2.575a1.5 1.5 0 0 0-2.121 0l-.3.3-1.089-.452V2A1.5 1.5 0 0 0 11 .5H9A1.5 1.5 0 0 0 7.5 2v.423l-1.09.452-.3-.3a1.5 1.5 0 0 0-2.121 0L2.576 3.99a1.5 1.5 0 0 0 0 2.121l.3.3L2.423 7.5H2A1.5 1.5 0 0 0 .5 9v2A1.5 1.5 0 0 0 2 12.5h.423l.452 1.09-.3.3a1.5 1.5 0 0 0 0 2.121l1.415 1.413a1.5 1.5 0 0 0 2.121 0l.3-.3 1.09.452V18A1.5 1.5 0 0 0 9 19.5h2a1.5 1.5 0 0 0 1.5-1.5v-.423l1.09-.452.3.3a1.5 1.5 0 0 0 2.121 0l1.415-1.414a1.5 1.5 0 0 0 0-2.121l-.3-.3.452-1.09H18a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 18 7.5Zm-8 6a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
                </svg>
                Settings
              </Button>
            </nav>
          </div>
        </div>

        <Separator orientation="vertical" className="ml-64 bg-white/20" />

        {/* Centered Posts Feed */}
        <div className="flex w-full justify-center pl-64">
          <div className="w-full max-w-3xl px-8 py-12">
            <div className="space-y-8">
              {posts.map((post, index) => (
                <Card
                  key={index}
                  className="bg-white/70 backdrop-blur-md border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-6">
                      <img
                        src={
                          post.avatar ||
                          "https://img.daisyui.com/images/profile/demo/gordon@192.webp"
                        }
                        alt="Profile"
                        className="w-14 h-14 rounded-full border-3 border-white/50 shadow-xl ring-2 ring-gradient-to-r ring-from-blue-400 ring-to-purple-400"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="font-bold text-gray-800 text-xl">
                            {post.username}
                          </span>
                          <span className="text-sm text-gray-500 bg-white/40 px-3 py-1 rounded-full backdrop-blur-sm">
                            {new Date(post.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                          {post.content}
                        </p>
                        {post.image && (
                          <div className="relative group mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/30 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="bg-white/40 hover:bg-white/60 text-white border border-white/30 shadow-lg rounded-full w-12 h-12"
                              >
                                <svg
                                  className="w-6 h-6"
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
                              className="w-full rounded-2xl shadow-xl border border-white/20"
                            />
                          </div>
                        )}

                        {/* Comment Button */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
                          <Button
                            onClick={() => handleCommentClick(post)}
                            variant="ghost"
                            className="flex items-center gap-2 bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/20 text-gray-700 rounded-xl px-6 py-3 transition-all duration-200 hover:scale-105"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium">Comment</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

      {/* Post Form Modal with Modern Design */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-white/95 backdrop-blur-md border-white/20 shadow-3xl rounded-2xl">
            <CardContent className="p-8">
              <Button
                onClick={() => setShowForm(false)}
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 bg-white/30 hover:bg-white/50 rounded-full z-10"
              >
                <X className="w-5 h-5" />
              </Button>
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                Create New Post
              </h3>
              <div className="mb-6">
                <Textarea
                  placeholder="What's on your mind?"
                  rows={4}
                  className="w-full bg-white/50 border-white/30 focus:border-blue-500/50 rounded-xl"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Button
                  onClick={handlePost}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-8 py-3 rounded-xl"
                >
                  Post
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/30 hover:bg-white/50 border border-white/20 rounded-xl"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/30 hover:bg-white/50 border border-white/20 rounded-xl"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button with Gradient */}
      <Button
        onClick={() => setShowForm(!showForm)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
        size="icon"
      >
        <Plus className="w-7 h-7" />
      </Button>
    </main>
  );
}

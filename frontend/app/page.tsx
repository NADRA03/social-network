"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { logout } from "@/app/utils/auth";
import BottomLeftNavigation from "./utils/navigation";
import { SquarePlus } from "lucide-react";
import { searchUsers } from "@/app/api";
import {
  House,
  MessageSquareMore,
  Bell,
  Search,
  Plus,
  Users,
  Camera,
  MessageCircle,
  X,
  Send,
  Star,
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
import { getSession } from "./api";
import { useSessionStore } from "./utils/store";


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
  image_url?: string;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const { username } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
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
    { id: number; name: string; username: string; avatar?: string }[]
  >([]);
  const [userAvatar, setUserAvatar] = useState("");
  const session = useSessionStore((s) => s.session);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef<any>(null);
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  async function uploadImageToSupabase(file: File): Promise<string | null> {
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
 
  useEffect(() => {
    const checkSession = async () => {
      try {
    const currentSession = await getSession(); 
    setHasSession(!!currentSession);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!hasSession) return;

      setIsLoading(true);
      try {
        const res = await axios.get("http://localhost:8080/feed", {
          withCredentials: true,
        });
        setPosts(res.data);
      } catch (err) {
        console.error("Failed to load posts", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (hasSession) {
      loadData();
      fetchUserAvatar();
    }
  }, [hasSession]);

  const fetchUserAvatar = async () => {
    try {
      const response = await axios.get("http://localhost:8080/profile/avatar", {
        withCredentials: true,
      });
      setUserAvatar(response.data.avatar);
    } catch (err) {
      console.error("Failed to fetch user avatar", err);
    }
  };

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

  const handleCommentImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      alert("Only JPEG, PNG, and GIF images are allowed");
      return;
    }

    setCommentImageFile(file);
  };


  const handleCommentClick = (post: Post) => {
    setSelectedPost(post);
    setShowComments(true);
    fetchComments(post.id);
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

  const handleFollow = async (userId: number) => {
    try {
      await axios.post(
        `http://localhost:8080/follow/${userId}`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to follow user", err);
    }
  };

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (query.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      const res = await searchUsers(query);
      if (Array.isArray(res)) {
        setResults(res);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300); // debounce delay
  }, [query]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-4 p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to Social Network
          </h1>
          <p className="text-gray-600 mb-8">Connect and share your thoughts</p>
          <div className="space-y-4">
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl"
            >
              Log In
            </Button>
            <Button
              onClick={() => router.push("/register")}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-xl"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
      {/*Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Social Network
            </h1>

            <nav className="hidden md:flex items-center gap-4">
              {/* <Button
                variant="ghost"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl px-4 py-2"
              >
                <House className="w-4 h-4" />
                Home
              </Button>
              <Button
                onClick={() => router.push(`/chat`)}
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:bg-white/50 rounded-xl px-4 py-2"
              >
                <MessageSquareMore className="w-4 h-4" />
                Messages
              </Button> */}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="relative">
      {/* ✅ Your original search bar — unchanged */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="search"
          placeholder="Search users..."
          className="pl-10 pr-4 py-2 w-80 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl focus:outline-none focus:border-transparent shadow-sm transition-all duration-200"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* 🔍 Search results */}
      {showResults && results.length > 0 && (
        <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-md z-50 max-h-64 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.ID}
              onClick={() => router.push(`/profile/${user.ID}`)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition flex items-center gap-3"
            >
              {user.AvatarURL ? (
                <img
                  src={user.AvatarURL}
                  alt={user.Username}
                  className="w-8 h-8 rounded-full object-cover border border-gray-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-300 text-white flex items-center justify-center font-semibold uppercase">
                  {user.Username?.charAt(0)}
                </div>
              )}
              <div className="text-sm font-medium">{user.Username}</div>
            </button>
          ))}
        </div>
      )}
            </div>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="p-0 bg-white/30 hover:bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl"
                >
                {
                  userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Profile"
                      className="h-10 w-10 rounded-lg border-2 border-white/30"
                    />
                  ) : (
                  <div className="relative h-10 w-10 rounded-lg text-white font-semibold uppercase overflow-hidden group">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-lg blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
                    <div className="relative z-10 flex items-center justify-center h-full w-full">
                      {session?.Username?.[0] || "?"}
                    </div>
                  </div>
                  )
                }
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white/90 backdrop-blur-md border-white/20"
              >
                <DropdownMenuItem
                  onClick={() => {
                    const currentUserId = session?.UserID;
                    if (!currentUserId) {
                      console.error("No user ID found in session");
                      return;
                    }
                    router.push(`/profile/${currentUserId}`);
                  }}
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="pt-20 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2 lg:col-start-2">
            <div className="space-y-6 pt-10">
              {/* Posts Feed */}
              {Array.isArray(posts) && posts.length > 0 ? (
                posts.map((post, index) => (
                  <Card
                    key={index}
                    className="bg-white/70 backdrop-blur-md border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                      <div
                        onClick={() => router.push(`/profile/${post.user_id}`)}
                        className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg font-semibold text-gray-700 dark:text-gray-200 cursor-pointer overflow-hidden"
                      >
                        {userAvatar ? (
                          <img
                            src={userAvatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{post.display_name?.[0]?.toUpperCase() || "?"}</span>
                        )}
                      </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-800">
                                {post.display_name}
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

                          <p className="text-gray-700 mb-4 text-base leading-relaxed"   style={{
    wordBreak: "break-word",
    overflowWrap: "break-word",
    overflowX: "hidden",
  }}>
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
  <Card className="w-full max-w-2xl max-h-[90vh] bg-white/95 backdrop-blur-md border-white/20 shadow-3xl rounded-2xl overflow-hidden flex flex-col">

    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
      <h3 className="text-xl font-bold text-gray-800">Comments</h3>
      <Button onClick={() => setShowComments(false)} variant="ghost" size="icon" className="bg-white/30 hover:bg-white/50 rounded-full">
        <X className="w-5 h-5" />
      </Button>
    </div>

    {/* Original Post */}
    <div className="p-6 border-b border-white/20 bg-white/30">
      <div className="flex items-start gap-4">
        {selectedPost.avatar ? (
          <img src={selectedPost.avatar} alt="Profile" className="w-12 h-12 rounded-full border-2 border-white/40 shadow-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-white/40 shadow-lg bg-gray-400 flex items-center justify-center text-white font-semibold text-lg">
            {selectedPost.username?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-gray-800">{selectedPost.username}</span>
            <span className="text-sm text-gray-500">{new Date(selectedPost.created_at).toLocaleString()}</span>
          </div>
          <p className="text-gray-700 break-words">{selectedPost.content}</p>
        </div>
      </div>
    </div>

    {/* Comments scrollable section */}
    <div className="flex-1 overflow-y-auto p-6 space-y-4 border-b border-white/20">
      {comments.map((comment) => (
        <div key={comment.id} className="flex items-start gap-3 p-4 bg-white/40 rounded-xl backdrop-blur-sm">
          <div className="w-12 h-12 rounded-full border-2 border-white/40 shadow-lg bg-gray-400 flex items-center justify-center text-white font-semibold text-lg">
            {comment.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-800">{comment.username}</span>
              <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <p className="text-gray-700 text-sm break-words">{comment.content}</p>
            {comment.image_url && (
              <div className="mt-2">
                <img src={comment.image_url} alt="Comment" className="max-h-40 rounded-md border border-gray-200" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Image Preview if selected */}
    {commentImageFile && (
      <div className="px-6 pt-3">
        <div className="relative">
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

    {/* Input area — always pinned at bottom */}
    <div className="p-6 bg-white/30">
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Textarea
            placeholder="Write a comment..."
            rows={2}
            className="flex-1 bg-white/50 border-white/30 focus:border-blue-500/50 rounded-xl resize-none"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          />
          <button type="button" onClick={() => commentFileInputRef.current?.click()} className="group">
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
          <button type="submit" onClick={submitComment} className="group">
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

      {/*Post Form */}
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
                {session?.AvatarURL ? (
                  <img
                    src={session.AvatarURL}
                    alt="Your profile"
                    className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full border-2 border-white/50 shadow-lg bg-gray-300 flex items-center justify-center text-lg font-semibold text-white">
                    {session?.Username?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <Textarea
                    placeholder="What's happening?"
                    rows={4}
                    className="w-full bg-white/50 border-white/30 focus:border-blue-500/50 rounded-xl resize-none text-lg"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                      style={{
    wordBreak: "break-word",
    overflowWrap: "break-word",
    overflowX: "hidden",
  }}
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-full shadow-md hover:shadow-purple-500/40 hover:scale-105 transition flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="group">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-2 rounded-full shadow-md hover:shadow-purple-500/40 hover:scale-105 transition flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      </button>
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

<button
  type="button"
  onClick={handlePost}
  disabled={!content.trim()}
  className="relative px-8 py-2 text-white font-medium group overflow-hidden rounded-md disabled:cursor-not-allowed"
>
  <span
    className={`absolute inset-0 w-full h-full rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200 ${
      content.trim()
        ? "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800"
        : "bg-gradient-to-br from-gray-400 to-gray-500"
    }`}
  ></span>
  <span className="relative z-10">Post</span>
</button>

              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button */}
<div
  onClick={() => setShowForm(!showForm)}
  className="fixed bottom-8 right-8 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 shadow-xl hover:shadow-purple-500/40 hover:scale-110 transition-all duration-300 cursor-pointer z-50"
>
  <SquarePlus className="w-8 h-8 text-white drop-shadow-lg" />
</div>

      <BottomLeftNavigation/>
    </main>
  );
}

"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  getGroupPosts,
  createGroupPost,
  getGroupComments,
  createGroupComment,
} from "../api";
import { useGroupStore } from "./store";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type GroupPost = {
  id: number;
  user_id: number;
  group_id: number;
  content: string;
  image_url?: string;
  created_at: string;
};

type GroupComment = {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  image_url?: string; 
  created_at: string;
};

export async function uploadGroupPostImage(file: File): Promise<string | null> {
  const filePath = `group-posts/${Date.now()}-${file.name}`;
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

export default function PostsSection() {
  const { selectedGroupId, selectedGroupDetails } = useGroupStore();
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [formData, setFormData] = useState({ content: "", image_url: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [hasImageSelected, setHasImageSelected] = useState(false);
  const [comments, setComments] = useState<Record<number, GroupComment[]>>({});
  const [commentImages, setCommentImages] = useState<Record<number, File | null>>({});
const [commentImageURLs, setCommentImageURLs] = useState<Record<number, string>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>(
    {}
  );
  const [expandedComments, setExpandedComments] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    if (!selectedGroupId) return;
    loadPosts();
  }, [selectedGroupId]);

  const loadPosts = async () => {
    try {
      const data = await getGroupPosts(selectedGroupId!);
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setPosts(sorted);

      for (const post of sorted) {
        const comments = await getGroupComments(post.id);
        setComments((prev) => ({ ...prev, [post.id]: comments }));
      }
    } catch (err) {
      console.error("Failed to load posts or comments", err);
    }
  };

  useEffect(() => {
    if (!selectedGroupId) return;

    setPosts([]);
    setComments({});
    setCommentInputs({});
    setExpandedComments({});

    loadPosts();
  }, [selectedGroupId]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedGroupId || !formData.content.trim()) return;

  const payload = {
    group_id: selectedGroupId,
    content: formData.content.trim(),
    ...(formData.image_url ? { image_url: formData.image_url } : {}),
  };

  console.log("[handleSubmit] Submitting payload:", payload);

  try {
    const newPost = await createGroupPost(payload);

    console.log("[handleSubmit] Post created:", newPost);

    setPosts((prev) =>
      Array.isArray(prev) ? [...prev, newPost] : [newPost]
    );
    setFormData({ content: "", image_url: "" });
    setImageFile(null);
    setHasImageSelected(false);
  } catch (err) {
    console.error("Failed to create post:", err);
  }
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
    setHasImageSelected(true);

    try {
      const imageUrl = await uploadGroupPostImage(file);
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      }
    } catch (err) {
      console.error("Failed to upload image", err);
      setHasImageSelected(false);
    }
  };

  const handleClearImage = () => {
    setImageFile(null);
    setHasImageSelected(false);
    setFormData((prev) => ({ ...prev, image_url: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCommentSubmit = async (postId: number) => {
    const content = commentInputs[postId]?.trim();
    if (!content && !commentImageURLs[postId]) return;

    try {
      const newComment = await createGroupComment({
        post_id: postId,
        content,
        image_url: commentImageURLs[postId] || undefined,
      });

      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      setCommentImages((prev) => ({ ...prev, [postId]: null }));
      setCommentImageURLs((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Failed to create comment", err);
    }
  };

  async function uploadGroupCommentImage(file: File): Promise<string | null> {
  const filePath = `group-comments/${Date.now()}-${file.name}`;
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

  const handleCommentImageChange = async (e: React.ChangeEvent<HTMLInputElement>, postId: number) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const validTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!validTypes.includes(file.type)) {
    alert("Only jpeg, jpg, and gif types are allowed");
    return;
  }

  setCommentImages((prev) => ({ ...prev, [postId]: file }));

  try {
    const imageUrl = await uploadGroupCommentImage(file);
    if (imageUrl) {
      setCommentImageURLs((prev) => ({ ...prev, [postId]: imageUrl }));
    }
  } catch (err) {
    console.error("Failed to upload comment image", err);
  }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post) => {
            const user = selectedGroupDetails?.members.find(
              (m) => m.ID === post.user_id
            );
            const createdDate = new Date(post.created_at).toLocaleDateString();

            return (
              <div key={post.id} className="space-y-1">
                <div className="flex items-start gap-4">
                  <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600 mt-5">
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      {user?.Username?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <p className="relative z-10 ml-1 text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      {user?.Username || "Unknown"}{" "}
                      <span className="text-xs text-gray-400 ml-1">
                        {createdDate}
                      </span>
                    </p>

                    <div className="relative p-5 bg-base-100 dark:bg-base-300 rounded-lg shadow-md border border-base-200 space-y-2 overflow-hidden">
                      <p
                        className="text-sm"
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                          overflowX: "hidden",
                        }}
                      >
                        {post.content}
                      </p>
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="rounded-md mt-2 max-h-64 object-contain border border-base-300"
                        />
                      )}

                      <div className="mt-4 space-y-2">
                        <button
                          className="text-xs text-blue-500 hover:underline"
                          onClick={() =>
                            setExpandedComments((prev) => ({
                              ...prev,
                              [post.id]: !prev[post.id],
                            }))
                          }
                        >
                          {expandedComments[post.id]
                            ? "Hide Comments"
                            : `View Comments (${
                                comments[post.id]?.length || 0
                              })`}
                        </button>

                        {expandedComments[post.id] && (
                          <>
                            {(comments[post.id] || []).map((comment) => {
                              const commenter =
                                selectedGroupDetails?.members.find(
                                  (m) => m.ID === comment.user_id
                                );
                              const date = new Date(
                                comment.created_at
                              ).toLocaleString(undefined, {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              });

                              return (
                                <div
                                  key={comment.id}
                                  className="text-sm p-2 flex gap-3 items-start"
                                >
                                  <div className="relative inline-flex items-center justify-center w-8 h-8 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                                    <span className="font-medium text-gray-600 dark:text-gray-300 text-xs">
                                      {commenter?.Username?.[0]?.toUpperCase() ||
                                        "?"}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span className="font-medium">
                                        {commenter?.Username || "User"}
                                        <span className="ml-3">{date}</span>
                                      </span>
                                    </div>
                                    <div className="mt-1 text-sm">
                                      {comment.content}
                                    </div>
                                  </div>
                              {comment.image_url && (
                                <img
                                  src={comment.image_url}
                                  alt="Comment"
                                  className="rounded-md mt-1 max-h-48 object-contain border border-base-300"
                                />
                              )}
                                </div>
                              );
                            })}

                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        className="input input-sm border-none outline-none focus:ring-0 focus:outline-none flex-1"
                        placeholder="Add a comment..."
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => document.getElementById(`comment-image-${post.id}`)?.click()}
                        className={`relative bg-white/30 hover:bg-white/50 border border-white/20 rounded-xl ${
                          commentImages[post.id] ? "bg-green-100 border-green-300" : ""
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <input
                          id={`comment-image-${post.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCommentImageChange(e, post.id)}
                          className="hidden"
                        />
                      </Button>

                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        className="btn btn-sm relative text-white font-medium group overflow-hidden rounded-md px-4 py-1.5"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
                        <span className="relative z-10">Reply</span>
                      </button>
                    </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400">No posts yet</p>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-base-300 flex flex-wrap gap-2 items-center bg-base-200"
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--b2)",
          zIndex: 10,
        }}
      >
        <input
          type="text"
          placeholder="What's on your mind?"
          className="input input-sm border-none outline-none focus:ring-0 focus:outline-none flex-1"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          required
        />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`relative bg-white/30 hover:bg-white/50 border border-white/20 rounded-xl ${
              hasImageSelected ? "bg-green-100 border-green-300" : ""
            }`}
          >
            <Camera className="w-4 h-4" />
            {hasImageSelected && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="hidden"
            />
          </Button>

          {hasImageSelected && (
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={handleClearImage}
              className="bg-red-100 hover:bg-red-200 text-red-600 rounded-xl"
            >
              <X />
            </Button>
          )}
        </div>

        <div className="w-full flex justify-center mt-3">
          <button
            type="submit"
            className="relative px-6 py-2 text-white font-medium group overflow-hidden rounded-md"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 rounded-md blur-sm opacity-70 group-hover:opacity-100 transition duration-200"></span>
            <span className="relative z-10">Post</span>
          </button>
        </div>
      </form>
    </div>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import {
  getGroupPosts,
  createGroupPost,
  getGroupComments,
  createGroupComment,
} from "../api";
import { useGroupStore } from "./store";

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
  created_at: string;
};

export default function PostsSection() {
  const { selectedGroupId, selectedGroupDetails } = useGroupStore();
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [formData, setFormData] = useState({ content: "", image_url: "" });
  const [comments, setComments] = useState<Record<number, GroupComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!selectedGroupId) return;
    loadPosts();
  }, [selectedGroupId]);

const loadPosts = async () => {
  try {
    const data = await getGroupPosts(selectedGroupId!);
    const sorted = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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

  try {
    const newPost = await createGroupPost({
      group_id: selectedGroupId,
      content: formData.content.trim(),
      image_url: formData.image_url || undefined,
    });

    setPosts((prev) => Array.isArray(prev) ? [...prev, newPost] : [newPost]);
    setFormData({ content: "", image_url: "" });
  } catch (err) {
    console.error("Failed to create post", err);
  }
};

const handleCommentSubmit = async (postId: number) => {
  const content = commentInputs[postId]?.trim();
  if (!content) return;

  try {
    const newComment = await createGroupComment({ post_id: postId, content });

    setComments((prev) => ({
      ...prev,
      [postId]: [...(Array.isArray(prev?.[postId]) ? prev[postId] : []), newComment],
    }));

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  } catch (err) {
    console.error("Failed to create comment", err);
  }
};

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Array.isArray(posts) && posts.length > 0 ? (
          posts.map((post) => {
            const user = selectedGroupDetails?.members.find(m => m.ID === post.user_id);
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
                      <span className="text-xs text-gray-400 ml-1">{createdDate}</span>
                    </p>

                    <div className="relative p-5 bg-base-100 dark:bg-base-300 rounded-lg shadow-md border border-base-200 space-y-2 overflow-hidden">
                      <p className="text-sm">{post.content}</p>
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
  {expandedComments[post.id] ? "Hide Comments" : `View Comments (${comments[post.id]?.length || 0})`}
</button>

  {expandedComments[post.id] && (
    <>
      {(comments[post.id] || []).map((comment) => {
        const commenter = selectedGroupDetails?.members.find(m => m.ID === comment.user_id);
        const date = new Date(comment.created_at).toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

        return (
<div key={comment.id} className="text-sm p-2 flex gap-3 items-start">
  <div className="relative inline-flex items-center justify-center w-8 h-8 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600  mt-2">
    <span className="font-medium text-gray-600 dark:text-gray-300 text-xs">
      {commenter?.Username?.[0]?.toUpperCase() || "?"}
    </span>
  </div>
  <div className="flex-1">
    <div className="flex justify-between text-xs text-gray-500">
      <span className="font-medium">{commenter?.Username || "User"}<span className="ml-3">{date}</span></span>
    </div>
    <div className="mt-1 text-sm">{comment.content}</div>
  </div>
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
        style={{ position: "sticky", bottom: 0, background: "var(--b2)", zIndex: 10 }}
      >
        <input
          type="text"
          placeholder="What's on your mind?"
          className="input input-sm border-none outline-none focus:ring-0 focus:outline-none flex-1"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
        />
        <input
          type="url"
          placeholder="Image URL (optional)"
          className="input input-sm border-none outline-none focus:ring-0 focus:outline-none  flex-1"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
        />

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

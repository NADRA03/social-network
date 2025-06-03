"use client";

import { useState } from "react";
import axios from "axios";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    nickname: "",
    avatar: "",
    about_me: "",
    dob: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8080/register", formData, {
        withCredentials: true,
      });
      alert("Registered successfully!");
    } catch (err: any) {
      alert("Registration failed.");
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-black">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-4 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold">Register</h2>
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="input"
          />
          <input
            name="first_name"
            placeholder="First Name"
            onChange={handleChange}
            className="input"
          />
          <input
            name="last_name"
            placeholder="Last Name"
            onChange={handleChange}
            className="input"
          />
          <input
            name="nickname"
            placeholder="Nickname"
            onChange={handleChange}
            className="input"
          />
          <input
            name="avatar"
            placeholder="Avatar URL (optional)"
            onChange={handleChange}
            className="input"
          />
          <textarea
            name="about_me"
            placeholder="About Me"
            onChange={handleChange}
            className="input"
          ></textarea>
          <input
            type="date"
            name="dob"
            onChange={handleChange}
            className="input"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Register
          </button>
        </form>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, User, UserPlus, Calendar } from "lucide-react";

export async function uploadProfilePicture(
    file: File
  ): Promise<string | null> {
    const filePath = `profiles/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("social") // or whatever your bucket is named
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload failed:", error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("social")
      .getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  }

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
    <div className="min-h-screen bg-fixed bg-no-repeat bg-cover bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/30 to-purple-600/30"></div>

      <Card className="relative w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <p className="text-gray-600 mt-2">Join our community today</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  onChange={handleChange}
                  required
                  className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  onChange={handleChange}
                  required
                  className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label
                  htmlFor="first_name"
                  className="text-gray-700 font-medium"
                >
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    name="first_name"
                    placeholder="First Name"
                    onChange={handleChange}
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="last_name"
                  className="text-gray-700 font-medium"
                >
                  Last Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    name="last_name"
                    placeholder="Last Name"
                    onChange={handleChange}
                    className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-gray-700 font-medium">
                Nickname
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  name="nickname"
                  placeholder="Your nickname"
                  onChange={handleChange}
                  className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-gray-700 font-medium">
                Avatar URL (Optional)
              </Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const imageUrl = uploadProfilePicture(file);
                    setFormData({ ...formData, avatar: imageUrl });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about_me" className="text-gray-700 font-medium">
                About Me (Optional)
              </Label>
              <Textarea
                name="about_me"
                placeholder="Tell us about yourself..."
                onChange={handleChange}
                className="bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="text-gray-700 font-medium">
                Date of Birth
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  name="dob"
                  onChange={handleChange}
                  className="pl-10 h-12 bg-gray-50/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Create Account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

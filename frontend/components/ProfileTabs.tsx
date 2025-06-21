import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building, GraduationCap, Award, Code, Briefcase } from "lucide-react";

export const ProfileTabs = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Tabs defaultValue="about" className="w-full">
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
              {/* TODO: Fetch and map user's posts from backend */}
              <p className="text-gray-500">No posts yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Joined Tab */}
        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Fetch and map user's groups from backend */}
              <p className="text-gray-500">No groups joined yet.</p>
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
              {/* TODO: Fetch and map user's liked posts from backend */}
              <p className="text-gray-500">No liked posts yet.</p>
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
              {/* TODO: Fetch and map user's comments from backend */}
              <p className="text-gray-500">No comments yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

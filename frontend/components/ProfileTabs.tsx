import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock } from "lucide-react";

interface ProfileTabsProps {
  canViewContent: boolean;
}

export const ProfileTabs = ({
  canViewContent,
}: ProfileTabsProps) => {
  const isLocked = !canViewContent;

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
                <p className="text-gray-500">No posts yet.</p>
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

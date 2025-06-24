import { Card, CardContent } from "@/components/ui/card";
import { Users, StickyNote, Eye } from "lucide-react";

interface ProfileStatsProps {
  followerCount: number;
  followingCount: number;
  postCount: number;
  isPrivate: boolean;
}

export const ProfileStats = ({
  isPrivate,
  followerCount,
  followingCount,
  postCount,
}: ProfileStatsProps) => {
  const stats = [
    {
      icon: Users,
      label: "Followers",
      value: followerCount,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Users,
      label: "Followings",
      value: followingCount,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: StickyNote,
      label: "No. of Posts",
      value: postCount,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      icon: Eye,
      label: "User Privacy",
      value: isPrivate ? "Private" : "Public",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 -mt-12 relative z-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <CardContent className="p-6 text-center">
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-3`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

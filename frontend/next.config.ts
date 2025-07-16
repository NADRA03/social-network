import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
  },
  // You can add more settings like images, redirects, etc.
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

export default nextConfig;

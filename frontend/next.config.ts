import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
  },
  eslint: {
    ignoreDuringBuilds: true, 
  },
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

export default nextConfig;

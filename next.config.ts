import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // これを追加：URL末尾のスラッシュを厳格に管理して404を防ぐ
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
    ],
  },
};

export default nextConfig;
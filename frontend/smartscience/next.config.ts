import type { NextConfig } from "next";

const nextConfig: NextConfig = { 
  // 1. Config Gambar (dari file .ts lama)
  images: { unoptimized: true }, 

  // 2. Config Proxy ke Backend (dari file .js lama)
  async rewrites() {
    // Pastikan env variable ini di-set di Vercel/Netlify
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
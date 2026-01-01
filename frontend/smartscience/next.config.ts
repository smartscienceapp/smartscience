import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",              // <--- WAJIB: Agar jadi file HTML statis
  images: { unoptimized: true }, // <--- WAJIB: Agar gambar tidak error
  // Tambahkan config lain di sini jika perlu
};

export default nextConfig;
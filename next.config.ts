import type { NextConfig } from "next";

const API_BASE = process.env.NEXT_PUBLIC_BASE_API_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactCompiler: true,

  async rewrites() {
    if (!API_BASE) return [];
    // Proxy `/api/*` to the upstream API so browser calls stay same-origin.
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE}/:path*`,
      },
    ];
  },
};

export default nextConfig;

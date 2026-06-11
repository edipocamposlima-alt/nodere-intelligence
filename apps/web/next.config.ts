import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/index.html"
      }
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nodere.com.br" }],
        destination: "https://nodere.com.br/:path*",
        permanent: true
      }
    ];
  }
};

export default nextConfig;

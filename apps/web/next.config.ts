import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "qhopjggnbzewuuktqntp.supabase.co" }]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb"
    }
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

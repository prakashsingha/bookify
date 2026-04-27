import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
        pathname: "/b/isbn/**",
      },
      {
        protocol: "https",
        hostname: "04nyssjw34flysb1.public.blob.vercel-storage.com",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;

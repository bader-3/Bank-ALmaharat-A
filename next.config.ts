import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-right",
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/account",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

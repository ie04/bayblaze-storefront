import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bayblaze.net",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "api.bayblaze.net",
        pathname: "/static/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/static/**",
      },
    ],
  },
};

export default nextConfig;

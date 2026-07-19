import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  images: {
    unoptimized: true,
    domains: [
      "crowdfunding.infura-ipfs.io",
      "gateway.pinata.cloud",
      "ipfs.io",
      "cloudflare-ipfs.com"
    ],
  },
};

export default nextConfig;

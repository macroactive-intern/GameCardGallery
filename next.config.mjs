import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { allowedImageHosts } = require("./config/image-hosts.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: allowedImageHosts.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
};

export default nextConfig;

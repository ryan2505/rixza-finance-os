import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The project sits under C:\Users\kount\Downloads where an unrelated
  // lockfile also lives; pin the workspace root to this folder.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

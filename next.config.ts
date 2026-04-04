import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Prefer this app when multiple lockfiles exist on the machine.
    root: path.join(__dirname),
  },
};

export default nextConfig;

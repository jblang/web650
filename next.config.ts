import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Silence the Carbon Sass deprecated `if()` helper warning only
  sassOptions: {
    silenceDeprecations: ["if-function"],
  },
  // Set the hostname for the dev server
  dev: {
    hostname: 'localhost',
  },
};

export default nextConfig;

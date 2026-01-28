import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Silence the Carbon Sass deprecated `if()` helper warning only
  sassOptions: {
    silenceDeprecations: ["if-function"],
  },
};

export default nextConfig;

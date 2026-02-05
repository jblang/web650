import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  // Silence the Carbon Sass deprecated `if()` helper warning only
  sassOptions: {
    silenceDeprecations: ["if-function"],
  },
};

export default nextConfig;

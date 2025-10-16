import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  webpack(config) {
    // Ignore LICENSE and other non-JS files
    config.module.rules.push({
      test: /\/(LICENSE|LICENCE|NOTICE|README|CHANGELOG)(\.|$)/,
      use: "ignore-loader",
    });

    config.module.rules.push({
      test: /\.(md|txt)$/,
      type: "asset/source",
    });

    return config;
  },
};

export default nextConfig;

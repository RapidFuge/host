import type { NextConfig } from "next";
import { version } from './package.json';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    APP_VERSION: version
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) { // Apply this rule only for client-side bundles
      config.resolve.fallback = {
        ...config.resolve.fallback, // Spread existing fallbacks
        fs: false, // Tells Webpack to provide an empty module for `fs`
        // You might need to add other Node.js core modules here if they cause issues
        // For example:
        // path: false,
        // os: false,
        // crypto: false, // or require.resolve('crypto-browserify')
      };
    }

    return config;
  },
};

export default nextConfig;

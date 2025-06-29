import type { NextConfig } from "next";
import { version } from './package.json';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ['@rapidfuge/gps-metadata-remover'],
  output: 'standalone',
  env: {
    APP_VERSION: version,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_REGION: process.env.VERCEL_REGION,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
    VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID,

    // --- Netlify Vars ---
    NETLIFY: process.env.NETLIFY,
    NETLIFY_SITE_NAME: process.env.NETLIFY_SITE_NAME,
    DEPLOY_ID: process.env.DEPLOY_ID,
    COMMIT_REF: process.env.COMMIT_REF,
    BRANCH: process.env.BRANCH,

    // --- GitHub Actions Vars ---
    GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
    GITHUB_RUN_NUMBER: process.env.GITHUB_RUN_NUMBER,
    GITHUB_WORKFLOW: process.env.GITHUB_WORKFLOW,
    GITHUB_SHA: process.env.GITHUB_SHA,

    // --- General CI/Docker Vars ---
    CI: process.env.CI,
    DOCKER: process.env.DOCKER,
    CONTAINER: process.env.CONTAINER,
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

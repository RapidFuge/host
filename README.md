# Rapid Host - File Hosting & URL Shortening Service

## Overview

Rapid Host is a modern, full-stack application designed for seamless file hosting and URL shortening. It provides a user-friendly dashboard for managing uploaded files, shortened links, and user-specific settings. Administrators have access to extended controls, including user management, sign-up token generation, and application analytics.

The frontend is built with Next.js and React, styled with Tailwind CSS, offering a responsive and dynamic user experience. The backend is powered by Next.js API routes, handling authentication, database interactions, file processing, and configuration management.

## Core Features

*   **File Uploads:**
    *   Securely upload various file types.
    *   View files directly on the platform (images, videos, audio, text, Markdown).
    *   Download original files.
    *   Generate ShareX (`.sxcu`) configuration files for quick uploads.
*   **URL Shortening:**
    *   Shorten long URLs to concise, shareable links.
    *   Manage created short links.
    *   Generate ShareX (`.sxcu`) configuration for URL shortening.
*   **User Dashboard:**
    *   **Gallery:** View, manage, and share uploaded files with pagination. Modal view for better image/video/audio preview, including download and delete options.
    *   **Links:** Table view of all shortened URLs with original link, creation date, and management options (delete).
    *   **Settings:**
        *   **User Configuration:**
            *   Change account password.
            *   Reset API token (used for ShareX/API uploads).
            *   Select preferred ID generator for file/link names (Random, Gfycat, Nanoid, ZWS, Timestamp).
            *   Control image embed preferences (direct image embed vs. informational card for Discord/social media).
            *   Set a custom description for embeds when direct image embed is off.
        *   **Admin Tools (Admin Only):**
            *   **Create User:** Directly create new user accounts.
            *   **Manage Sign-Up Tokens:** Generate and delete tokens required for user registration, with configurable expiration times.
            *   **Analytics Page:** View application statistics including total users, files, URLs, and storage usage (MongoDB & File Storage).
*   **Authentication:**
    *   User login and session management (presumably NextAuth.js).
    *   Token-based authentication for API interactions (e.g., ShareX uploads).
*   **File Previews & Sharing:**
    *   Direct link access to files (`/[fileID]`).
    *   GitHub Flavored Markdown (GFM) rendering for `.md` files, including syntax highlighting for code blocks.
    *   Raw text view with syntax highlighting for various code/text file types.
    *   Optimized Open Graph and Twitter Card meta tags for rich link previews on social media (Discord, Twitter, etc.), respecting user embed preferences for images.
*   **Admin Capabilities:**
    *   View and manage any user's files and links.
    *   Comprehensive user and application settings management.

## Tech Stack (Inferred)

*   **Frontend:** Next.js (React), Tailwind CSS
*   **Backend:** Next.js API Routes (Node.js)
*   **Authentication:** NextAuth.js (likely), bcrypt (for password hashing)
*   **Database:** MongoDB (inferred from analytics section)
*   **Markdown Processing:** `remark`, `remark-gfm`, `rehype-react`, `rehype-prism-plus`
*   **Syntax Highlighting (Raw View):** `prism-react-renderer`
*   **File Storage:** MinIO

## Setup & Deployment

*   Standard Next.js project setup (`npm install`, `npm run dev`).
*   Production builds via `npm run build` and `npm start`.
*   Dockerfile provided for containerized deployments (both standalone and traditional Next.js builds).
*   Requires environment variables for database connection, NextAuth secret, JWT secret, etc.

## Key API Endpoints (Examples)

*   `/api/files/[id]` (GET, DELETE) - Manage individual files
*   `/api/url/[tag]` (GET, DELETE) - Manage individual short links
*   `/api/users/[username]/files` (GET) - List user's files
*   `/api/users/[username]/links` (GET) - List user's links
*   `/api/users/[username]/configuration` (GET, POST) - Manage user-specific settings
*   `/api/users/create` (POST) - Admin: Create user
*   `/api/users/tokens` (GET, POST) - Admin: Manage sign-up tokens
*   `/api/users/tokens/[tokenValue]` (DELETE) - Admin: Delete sign-up token
<!-- *   `/api/admin/analytics/stats` (GET) - Admin: Get application stats
*   `/api/admin/analytics/storage` (GET) - Admin: Get storage stats -->

This project offers a robust and feature-rich platform for personal or small-group file and link management.
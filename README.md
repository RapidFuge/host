# Rapid Host - File Hosting & URL Shortening Service
  [![status-badge](https://pecker.fuge.dev/api/badges/3/status.svg?events=manual)](https://pecker.fuge.dev/repos/3)
  <a href="https://github.com/users/rapidfuge/packages/container/package/host">
    <img src="https://img.shields.io/badge/docker-ghcr.io/dinosoftware/dinosonic-blue?style=flat&logo=docker" alt="GHCR Docker Image">
  </a>
  <a href="https://codeberg.org/rapid/-/packages/container/host">
    <img src="https://img.shields.io/badge/docker-codeberg.org/dinosoftware/dinosonic-blue?style=flat&logo=docker" alt="Codeberg Docker Image">
  </a>
  <a href="https://git.fuge.dev/Rapid/-/packages/container/host">
    <img src="https://img.shields.io/badge/docker-git.fuge.dev/dinosoftware/dinosonic-blue?style=flat&logo=docker" alt="Forgejo Docker Image">
  </a>

Rapid Host is a self-hostable service for managing your files and shortening URLs, built with Next.js and React. It provides a user-friendly dashboard, ShareX compatibility, and admin controls.

## Repositories

Rapid Host is available on multiple platforms. GitHub serves as a mirror — the primary repository is on the self-hosted Forgejo instance.

| Platform              | URL                                                            |
| --------------------- | -------------------------------------------------------------- |
| **Primary** (Forgejo) | [git.fuge.dev/rapid/host](https://git.fuge.dev/rapid/host)     |
| **Mirror** (Codeberg) | [codeberg.org/rapid/host](https://codeberg.org/rapid/host)     |
| **Mirror** (GitHub)   | [github.com/rapidfuge/host](https://github.com/rapidfuge/host) |

## Docker Images

Container images are published to multiple registries:

| Registry              | Image                            |
| --------------------- | -------------------------------- |
| **Primary**           | `git.fuge.dev/rapid/host:latest` |
| **Mirror** (Codeberg) | `codeberg.org/rapid/host:latest` |
| **Mirror** (GitHub)   | `ghcr.io/rapidfuge/host:latest`  |

## Features

*   **File Uploads:** Securely upload and manage various file types.
*   **URL Shortening:** Create custom or randomly generated short links.
*   **User Dashboard:**
    *   **Gallery:** View and manage your uploaded files.
    *   **Links:** Manage your shortened URLs.
    *   **Settings:** Configure your account, API token, ID generator, and embed preferences.
*   **ShareX Support:** Generate `.sxcu` configuration files for easy uploading and URL shortening directly from ShareX.
*   **Admin Panel:** (For admin users)
    *   User management (create users).
    *   Sign-up token management.
    *   Application analytics (user counts, storage usage).
*   **Link Previews:** Optimized Open Graph and Twitter Card meta tags for rich link previews on social media, with user-configurable image embed options.
*   **File Previews:** View images, videos, audio, text, and Markdown files directly on the platform. GitHub Flavored Markdown rendering with syntax highlighting.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Authentication:** [NextAuth.js](https://next-auth.js.org/)
*   **Database (Metadata):** [MongoDB](https://www.mongodb.com/)
*   **File Storage:** Local, AWS S3 (or any S3-compatible service)
*   **Markdown:** `remark`, `remark-gfm`, `rehype-react`, `rehype-prism-plus`
*   **Syntax Highlighting:** `prism-react-renderer`, `rehype-prism-plus`

## Setup

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm or yarn or pnpm
*   MongoDB instance (local or cloud-hosted like MongoDB Atlas)
*   S3 instance
    * Alternatively, Use Local Storage

### Installation

1.  **Clone the repository:**
     ```bash
     git clone https://git.fuge.dev/rapid/host
     cd host
     ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn
    # or
    pnpm install
    ```

3.  **Environment Variables:**
    Create a `.env.local` file in the root of the project and configure the following variables:

    ```ini
    ISPRODUCTION=true # Whether to actually delete stray files
    ROOT_PASSWORD=serverRootPass # Default root password. Only needed on first init of MongoDB
    PREVENT_ROOT_DELETION=true # Prevent deletion of the root user
    STORAGE=3 # 1: Local storage (/upload dir). 2, or anything else: S3 (Default) S3 File DB

    # NextAuth.js
    NEXTAUTH_SECRET=you_secret_key # Generate a strong secret: openssl rand -base64 32

    # MongoDB
    MONGO_URI=mongodb://user:password@host:port/database_name # Your MongoDB connection string

    # If you're using S3
    S3_ENDPOINT=your-s3-endpoint.com # e.g., localhost or s3.amazonaws.com or localhost:9010
    S3_ACCESS_KEY=YOUR_S3_ACCESS_KEY
    S3_SECRET_KEY=YOUR_S3_SECRET_KEY
    S3_BUCKET=your-bucket-name # Name of the bucket for file storage
    S3_USE_SSL=false # Whether to use SSL or not
    S3_PORT=9010 # S3 Instance Port. Default is 9010

    # Upload Settings
    CHUNKED_UPLOADS=true # Set to false to disable chunked uploads (useful if not behind Cloudflare Tunnel)
    ```
    **Note:** For production, use strong, unique secrets and appropriate URLs.

4.  **Database Setup:**
    *   Ensure your MongoDB instance is running and accessible.
    *   The application will typically create collections as needed, but ensure the user specified in `MONGODB_URI` has read/write permissions.

5.  **File Storage Setup:**
    * **Default: S3 Bucket Setup:**
        *   Ensure your S3 server is running.
        *   Make sure the bucket specified in `S3_BUCKET` exists and the provided access/secret keys have permissions to read, write, and delete objects in that bucket.
    * **1: Local Storage Setup:**
        * Ensure the app is able to be able to write to ./uploads
        * If you're using docker, make sure to link the ./uploads dir to the outside host, if you want.

### Running the Application

*   **Development:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

*   **Production Build:**
    ```bash
    npm run build
    ```

*   **Start Production Server:**
    ```bash
    npm start
    ```

### Deployment (Docker)

A `Dockerfile` is provided for containerized deployments.

1.  **Build the Docker image:**
    ```bash
    docker build -t host .
    ```
2.  **Run the Docker container:**
    ```bash
    docker run -p 3000:3000 \
      -e NEXTAUTH_URL=true \
      -e NEXTAUTH_URL="http://yourdomain.com" \
      -e NEXTAUTH_SECRET="your_strong_secret" \
      -e MONGODB_URI="your_mongodb_connection_string" \
      -e ROOT_PASSWORD="serverRootPass" \
      -e PREVENT_ROOT_DELETION=true \
      -e STORAGE=3 \
      -e S3_ENDPOINT="your_S3_endpoint" \
      -e S3_USERNAME="your_access_key_or_password" \
      -e S3_PASSWORD="your_secret_key_or_password" \
      -e S3_BUCKET="your_bucket" \
      ghcr.io/rapidfuge/host:latest
      # Also available: git.fuge.dev/rapid/host:latest
      # Also available: codeberg.org/rapid/host:latest
      ```
    **Use Docker Compose instead:**
    ```yaml
      services:  
        server:  
        container_name: host  
         image: git.fuge.dev/rapid/host:latest  # Also: codeberg.org/rapid/host:latest | ghcr.io/rapidfuge/host:latest
        restart: always  
        ports:  
            - "3000:3000"  
        environment:  
            ISPRODUCTION: "true" # Whether to delete expired/stray files/database entry.  
            NEXTAUTH_SECRET: something_secret_here  
            NEXTAUTH_URL: https://i.fuge.dev # What the domain of the host is gonna be. Not required anymore.
            ROOT_PASSWORD: serverRootPass # Default root password  
            MONGO_URI: 'mongodb://MONGO_USERNAME:MONGO_PASSWORD@mongodb:27017/'  
            STORAGE: 1 # Again, 1 For local, 2 For S3
            PREVENT_ROOT_DELETION: "true"
            S3_ENDPOINT: 'minio:9000' # If STORAGE is set to 3
            S3_BUCKET: S3_BUCKET 
            S3_ACCESS_KEY: S3_ACCESS_KEY 
            S3_SECRET_KEY: S3_SECRET_KEY 
            CHUNKED_UPLOADS: true # Set to false to disable chunked uploads (useful if not behind Cloudflare Tunnel)
        volumes: # If STORAGE is set to 1
            - ./uploads:/app/uploads # local_folder:/app/uploads do not change /app/uploads 
        # If you're going to have mongodb with Rapid Host in the same compose file
        # depends_on:  
        #     - mongodb
        #     - minio # if minio is in the same compose file
    ```
    Replace placeholder values with your actual production configuration. Ensure the port mapping (`-p 3000:3000`).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

Rapid Host is licensed under the [**MIT License**](https://opensource.org/license/MIT).
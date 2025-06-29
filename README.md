# Rapid Host - File Hosting & URL Shortening Service

Rapid Host is a self-hostable service for managing your files and shortening URLs, built with Next.js and React. It provides a user-friendly dashboard, ShareX compatibility, and admin controls.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frapidfuge%2Fhost&env=MONGO_URI,STORAGE,ISPRODUCTION,ROOT_PASSWORD,NEXTAUTH_URL,NEXTAUTH_SECRET&envDescription=Go%20read%20the%20number%203%20of%20installation%20on%20the%20README%20for%20more%20information%20about%20the%20Environment%20variables.&envLink=https%3A%2F%2Fgithub.com%2FRapidFuge%2Fhost%2F%23installation)

###### Note: If you're deploying from vercel, It is highly recommended that you use vercel's Blob storage.

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
*   **File Storage:** [MinIO](https://min.io/) (or any S3-compatible service)
*   **Markdown:** `remark`, `remark-gfm`, `rehype-react`, `rehype-prism-plus`
*   **Syntax Highlighting:** `prism-react-renderer`, `rehype-prism-plus`

## Setup

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm or yarn or pnpm
*   MongoDB instance (local or cloud-hosted like MongoDB Atlas)
*   MinIO instance (Maybe plans of adding S3 support)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/rapidfuge/host
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
    ISPRODUCTION=true # Whether to actually delete stray files.
    ROOT_PASSWORD=serverRootPass # Default root password. Only needed on first init of MongoDB
    PREVENT_ROOT_DELETION=true # Prevent deletion of the root user.
    STORAGE=3 # 1: Local storage (/upload dir). 2: Vercel Blob (This requires the BLOB_READ_WRITE_TOKEN env variable set by vercel.). 3, or anything else: MinIO (Default) Minio File DB

    # NextAuth.js
    NEXTAUTH_URL=http://localhost:3000 # Change in production
    NEXTAUTH_SECRET= # Generate a strong secret: openssl rand -base64 32

    # MongoDB
    MONGO_URI=mongodb://user:password@host:port/database_name # Your MongoDB connection string

    # If you're using MinIO
    # MinIO (or S3 compatible)
    MINIO_ENDPOINT=your-minio-endpoint.com # e.g., localhost or s3.amazonaws.com or localhost:9010
    MINIO_USERNAME=YOUR_MINIO_ACCESS_KEY_OR_USERNAME
    MINIO_PASSWORD=YOUR_MINIO_SECRET_KEY_OR_PASSWORD
    MINIO_BUCKET=your-bucket-name # Name of the bucket for file storage
    ```
    **Note:** For production, use strong, unique secrets and appropriate URLs.

4.  **Database Setup:**
    *   Ensure your MongoDB instance is running and accessible.
    *   The application will typically create collections as needed, but ensure the user specified in `MONGODB_URI` has read/write permissions.

5.  **MinIO/S3 Bucket Setup:**
    *   Ensure your MinIO server is running or your S3 bucket\* is created (\*Maybe, not supported yet).
    *   Make sure the bucket specified in `MINIO_BUCKET` exists and the provided access/secret keys have permissions to read, write, and delete objects in that bucket.
    *   Configure bucket policies for public read access if you want files to be directly viewable via their MinIO/S3 URLs (alternatively, files can be served through a Next.js API route).

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
      -e NEXTAUTH_URL="http://yourdomain.com" \
      -e NEXTAUTH_SECRET="your_strong_secret" \
      -e MONGODB_URI="your_mongodb_connection_string" \
      -e MINIO_ENDPOINT="your_minio_endpoint" \
      -e MINIO_USERNAME="your_access_key_or_password" \
      -e MINIO_PASSWORD="your_secret_key_or_password" \
      -e MINIO_BUCKET="your_bucket" \
      host
    ```
    Replace placeholder values with your actual production configuration. Ensure the port mapping (`-p 3000:3000`) matches the `PORT` exposed by the container (default 3000).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

Rapid Host is licensed under the [**MIT License**](https://opensource.org/license/MIT).
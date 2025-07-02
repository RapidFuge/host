# Rapid Host - File Hosting & URL Shortening Service

Rapid Host is a self-hostable service for managing your files and shortening URLs, built with Next.js and React. It provides a user-friendly dashboard, ShareX compatibility, and admin controls.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frapidfuge%2Fhost&env=MONGO_URI,STORAGE,ISPRODUCTION,ROOT_PASSWORD,NEXTAUTH_URL,NEXTAUTH_SECRET&envDescription=Go%20read%20the%20number%203%20of%20installation%20on%20the%20README%20for%20more%20information%20about%20the%20Environment%20variables.&envLink=https%3A%2F%2Fgithub.com%2FRapidFuge%2Fhost%2F%23installation)

###### Note: If you're deploying from vercel, It is highly recommended that you use vercel's Blob storage. Or, alternatively, MinIO/S3.

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
*   **File Storage:** Local, [Vercel Blob](https://vercel.com/storage/blob), [MinIO](https://min.io/) (or any S3-compatible service)
*   **Markdown:** `remark`, `remark-gfm`, `rehype-react`, `rehype-prism-plus`
*   **Syntax Highlighting:** `prism-react-renderer`, `rehype-prism-plus`

## Setup

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm or yarn or pnpm
*   MongoDB instance (local or cloud-hosted like MongoDB Atlas)
*   MinIO/S3 instance
    * Alternatively, Use Local Storage (If not hosting from vercel)
    * or, Vercel Blob (If hosting from vercel)

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
    ISPRODUCTION=true # Whether to actually delete stray files
    ROOT_PASSWORD=serverRootPass # Default root password. Only needed on first init of MongoDB
    PREVENT_ROOT_DELETION=true # Prevent deletion of the root user
    STORAGE=3 # 1: Local storage (/upload dir). 2: Vercel Blob (This requires the BLOB_READ_WRITE_TOKEN env variable set by vercel.). 3, or anything else: MinIO (Default) Minio File DB

    # NextAuth.js
    NEXTAUTH_SECRET=you_secret_key # Generate a strong secret: openssl rand -base64 32

    # MongoDB
    MONGO_URI=mongodb://user:password@host:port/database_name # Your MongoDB connection string

    # If you're using MinIO/S3
    # MinIO (or S3 compatible)
    MINIO_ENDPOINT=your-minio-endpoint.com # e.g., localhost or s3.amazonaws.com or localhost:9010
    MINIO_ACCESS_KEY=YOUR_MINIO_ACCESS_KEY
    MINIO_SECRET_KEY=YOUR_MINIO_SECRET_KEY
    MINIO_BUCKET=your-bucket-name # Name of the bucket for file storage
    MINIO_USE_SSL=false # Whether to use SSL or not
    MINIO_PORT=9010 # MinIO/S3 Instance Port. Default is 9010
    ```
    **Note:** For production, use strong, unique secrets and appropriate URLs.

4.  **Database Setup:**
    *   Ensure your MongoDB instance is running and accessible.
    *   The application will typically create collections as needed, but ensure the user specified in `MONGODB_URI` has read/write permissions.

5.  **File Storage Setup:**
    * **Default: MinIO/S3 Bucket Setup:**
        *   Ensure your MinIO/S3 server is running.
        *   Make sure the bucket specified in `MINIO_BUCKET` exists and the provided access/secret keys have permissions to read, write, and delete objects in that bucket.
    * **1: Local Storage Setup:**
        * Ensure the app is able to be able to write to ./uploads
        * If you're using docker, make sure to link the ./uploads dir to the outside host, if you want.
    * **2: Vercel Blob Setup:**
        * After initializing the project on vercel, go to storage and setup/connect the blob to your project.
        * Redeploy ater connecting the blob to your project.

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
      -e MINIO_ENDPOINT="your_minio_endpoint" \
      -e MINIO_USERNAME="your_access_key_or_password" \
      -e MINIO_PASSWORD="your_secret_key_or_password" \
      -e MINIO_BUCKET="your_bucket" \
      ghcr.io/rapidfuge/host:latest
    ```
    **Use Docker Compose instead:**
    ```yaml
      services:  
        server:  
        container_name: host  
        image: ghcr.io/rapidfuge/host:latest  
        restart: always  
        ports:  
            - "3000:3000"  
        environment:  
            ISPRODUCTION: "true" # Whether to delete expired/stray files/database entry.  
            NEXTAUTH_SECRET: something_secret_here  
            NEXTAUTH_URL: https://i.fuge.dev # What the domain of the host is gonna be. Not required anymore.
            ROOT_PASSWORD: serverRootPass # Default root password  
            MONGO_URI: 'mongodb://MONGO_USERNAME:MONGO_PASSWORD@mongodb:27017/'  
            STORAGE: 1 # Again, 1 For local, 2 For vercel Blob, 3 For MinIO
            PREVENT_ROOT_DELETION: "true"
            MINIO_ENDPOINT: 'minio:9000' # If STORAGE is set to 3
            MINIO_BUCKET: MINIO_BUCKET 
            MINIO_ACCESS_KEY: MINIO_ACCESS_KEY 
            MINIO_SECRET_KEY: MINIO_SECRET_KEY 
        volumes: # If STORAGE is set to 1
            - ./uploads:/app/uploads # local_folder:/app/uploads do not change /app/uploads 
        # If you're going to have mongodb with rapid host in the same compose file
        # depends_on:  
        #     - mongodb
        #     - minio # if minio is in the same compose file
    ```
    Replace placeholder values with your actual production configuration. Ensure the port mapping (`-p 3000:3000`).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

Rapid Host is licensed under the [**MIT License**](https://opensource.org/license/MIT).
// pages/api/users/[id]/files.ts
// Or if your file is literally named [id].ts, that's fine,
// just remember 'id' here means 'id'
import { NextApiRequest, NextApiResponse } from "next";
import { getDatabase } from '@lib/db'; // Assuming File is exported from @lib/db
import type { File as DBFileType } from "@lib/models/file";
import { errorGenerator } from "@lib";
import { getToken } from "next-auth/jwt";
import mime from 'mime-types'; // Import mime-types

// Your File interface from @lib/db
// export interface File extends Document { // Assuming Document is from Mongoose or similar
//   created: Date;
//   extension?: string;
//   id: string;         // This is the actual file ID for /api/files/[id]
//   fileName: string;   // e.g., "image.png", "document.pdf"
//   videoThumbnail?: string;
//   owner: string;
//   isPrivate: boolean;
// }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const page = parseInt(req.query.page as string, 10) || 0;
    const db = await getDatabase();

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;

    if (!token && !authHeader) {
        return res.status(401).json(errorGenerator(401, "Unauthorized: No token or auth header."));
    }

    const userToken = authHeader ? authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader : token?.token;

    if (!userToken) {
        return res.status(401).json(errorGenerator(401, "Unauthorized: Token is invalid or missing."));
    }

    const user = await db.getUserByToken(userToken);

    if (!user) {
        return res.status(401).json(errorGenerator(401, "Unauthorized: User not found for token."));
    }
    if (id !== user.username && !user.isAdmin) {
        return res.status(403).json(errorGenerator(403, "Forbidden: You are not authorized to view these files."));
    }

    if (isNaN(page) || page < 0) {
        return res.status(400).json(errorGenerator(400, "Invalid page number"));
    }

    try {
        const { files: dbFiles, totalPages } = await db.getUserFiles(id as string, page);

        const processedFiles = dbFiles.map((file: DBFileType) => {
            const determinedMimeType = mime.lookup(file.fileName);
            return {
                id: file.id,
                filename: file.fileName,
                mimetype: determinedMimeType || 'application/octet-stream',
                isPrivate: file.isPrivate, // <-- ADDED
                created: file.created,     // <-- ADDED (useful for display)
                // url is constructed client-side by GalleryComponent
            };
        });

        return res.json({
            success: true,
            files: processedFiles,
            totalPages,
            currentPage: page
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`API Error fetching files for ${id}:`, error);
        if (error.message.toLowerCase().includes("not found")) {
            return res.status(404).json(errorGenerator(404, `Files not found for user ${id}.`));
        }
        return res.status(500).json(errorGenerator(500, error.message || 'Internal server error retrieving files.'));
    }
}
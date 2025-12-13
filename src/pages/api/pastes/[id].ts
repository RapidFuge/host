import type { NextApiRequest, NextApiResponse } from 'next';
import { errorGenerator } from '@lib';
import { getDatabase } from '@lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getDatabase();
    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;

    let user;
    if (session || authHeader) {
        user = await db.getUserByToken(authHeader || session?.user.token);
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json(errorGenerator(400, "Invalid paste identifier."));
    }

    const withoutExt = id.toString().indexOf('.') !== -1 ? id.toString().substring(0, id.toString().indexOf('.')) : id.toString();
    const pasteId = withoutExt || id;

    // Get the paste from the database
    const paste = await db.getFile(pasteId);
    if (!paste) {
        return res.status(404).json(errorGenerator(404, "Paste not found."));
    }

    // Verify this is actually a paste
    if (paste.fileType !== 'paste') {
        return res.status(400).json(errorGenerator(400, "This is not a paste and cannot be edited."));
    }

    // Check authorization for editing
    if (!user || paste.owner !== user.username) {
        return res.status(403).json(errorGenerator(403, "Forbidden: Only the owner can edit this paste."));
    }

    try {
        switch (req.method) {
            case "PUT":
                // Parse the request body manually since bodyParser is false
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                await new Promise((resolve) => {
                    req.on('end', () => resolve(null));
                });

                try {
                    const { content, language, fileName: newPublicFileName } = JSON.parse(body);

                    if (typeof content !== 'string') return res.status(400).json(errorGenerator(400, "Content is required and must be a string."));

                    // Update file content in storage
                    const contentBuffer = Buffer.from(content, 'utf8');

                    // Clear any cached version of the file to ensure fresh content is served
                    const cachePath = path.join(os.tmpdir(), paste.fileName);
                    if (await fs.pathExists(cachePath)) {
                        await fs.unlink(cachePath);
                    }

                    // Use the imageDrive put method to update the content
                    // Following the same approach as the original file upload
                    if (contentBuffer.length > 1024 * 1024 * 1024) { // If larger than 1GB
                        const tempPath = path.join(os.tmpdir(), paste.fileName);
                        await fs.writeFile(tempPath, contentBuffer);
                        await db.imageDrive.put(paste.fileName, tempPath);
                        await fs.unlink(tempPath);
                    } else {
                        await db.imageDrive.put(paste.fileName, contentBuffer);
                    }

                    // Update file size and other metadata in database
                    const newSize = contentBuffer.length;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const updateFields: any = { size: newSize };

                    if (language) updateFields.extension = language;
                    if (newPublicFileName) updateFields.publicFileName = newPublicFileName;

                    await db.fileBase.updateOne(
                        { id: pasteId },
                        { $set: updateFields }
                    );

                    return res.status(200).json({
                        success: true,
                        message: "Paste updated successfully.",
                        id: pasteId
                    });
                } catch (parseError) {
                    console.error('Error parsing request body:', parseError);
                    return res.status(400).json(errorGenerator(400, "Invalid request body, must be valid JSON."));
                }

            case "GET":
                // Return paste information (if needed for editing interface)
                return res.status(200).json({
                    id: paste.id,
                    fileName: paste.fileName,
                    publicFileName: paste.publicFileName,
                    extension: paste.extension,
                    size: paste.size,
                    owner: paste.owner,
                    isPrivate: paste.isPrivate,
                    expiresAt: paste.expiresAt,
                    created: paste.created,
                    fileType: paste.fileType
                });

            default:
                return res.setHeader('Allow', ['PUT', 'GET']).status(405).json({ error: 'Method Not Allowed' });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Paste edit handler error:', error);
        return res.status(500).json(errorGenerator(500, 'Internal server error.'));
    }
}
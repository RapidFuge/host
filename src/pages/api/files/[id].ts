import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { errorGenerator } from '@lib';
import * as generators from '@lib/generators';
import { getDatabase } from '@lib/db';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { isAscii } from 'validator';
import mime from 'mime-types';
const removeExt = (str: string) => str.substring(0, str.indexOf('.'));

export const config = {
    api: {
        responseLimit: false
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getDatabase();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    let user;
    if (token || authHeader) user = await db.getUserByToken(authHeader || token?.token);

    const { id } = req.query;
    if (!id || typeof id !== 'string') return res.status(400).json(errorGenerator(400, "Invalid file identifier."));

    const withoutExt = removeExt(id);
    const fileId = withoutExt || id;

    if (!generators.checkIfZws(fileId) && !isAscii(fileId)) return res.status(400).json(errorGenerator(400, "Invalid file identifier, should be alphanumeric or ZWS."));

    const file = await db.getFile(fileId);
    if (!file) return res.status(404).json(errorGenerator(404, "File not found."));

    try {
        switch (req.method) {
            case "DELETE":
                if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
                if (file.owner !== user.username && !user.isAdmin) return res.status(403).json(errorGenerator(403, "Forbidden."));

                await db.removeFile(file.id);
                await db.imageDrive.remove(file.fileName);
                return res.status(200).json({ success: true, message: "File deleted." });
            case "POST":
                if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
                if (file.owner !== user.username && !user.isAdmin) return res.status(403).json(errorGenerator(403, "Forbidden."));

                const { isPrivate, removeExpiry } = req.body;

                if (removeExpiry) {
                    if (typeof removeExpiry !== 'boolean') return res.status(400).json(errorGenerator(400, "Invalid 'removeExpiry' value. Must be a boolean."));

                    await db.setFileExpiry(fileId, null);
                    return res.status(200).json({ success: true, message: "File expirty updated." });
                }

                if (typeof isPrivate !== 'boolean') return res.status(400).json(errorGenerator(400, "Invalid 'isPrivate' value. Must be a boolean."));

                await db.setFilePrivacy(fileId, isPrivate);
                return res.status(200).json({ success: true, message: "File privacy updated." });
            case "GET":
                if (file.isPrivate && (!user || file.owner !== user.username && !user.isAdmin)) return res.status(403).json(errorGenerator(403, "Forbidden."));
                if (req.headers.getinfo === "true") {
                    const owner = await db.getUser(file.owner);
                    return res.json({
                        ...file.toJSON(),
                        ownerEmbedPreference: owner.embedImageDirectly,
                        ownerCustomDescription: owner.customEmbedDescription
                    });
                };

                const Path = path.join(os.tmpdir(), file.fileName);
                const downloadFilename = file.publicFileName || `${file.id}${file.extension ? `.${file.extension}` : ''}`;
                let Mime;
                if (file.extension === 'ts') {
                    Mime = 'text/typescript';
                } else if (file.extension === 'mp4') {
                    Mime = 'video/mp4';
                } else {
                    Mime = mime.lookup(file.fileName) || 'application/octet-stream';
                }

                res.setHeader("Content-Type", Mime);
                res.setHeader('Content-Disposition', `inline; filename="${downloadFilename}"`);

                if (fs.existsSync(Path)) {
                    // console.log(`CACHE HIT: Serving ${file.fileName} from local cache.`);
                    const cacheStream = fs.createReadStream(Path);
                    cacheStream.pipe(res);
                    return;
                }

                try {
                    const minioStream = await db.imageDrive.get(file.fileName);
                    const cacheWriteStream = fs.createWriteStream(Path);

                    minioStream.pipe(res);
                    minioStream.pipe(cacheWriteStream);

                    cacheWriteStream.on('error', err => {
                        console.error('Error writing to cache:', err);
                        fs.unlink(Path, () => { });
                    });

                } catch (error) {
                    console.error("Could not get file stream from storage:", error);
                    return res.status(500).json(errorGenerator(500, 'Could not retrieve file from storage.'));
                }

                return;
            default:
                return res.setHeader('Allow', ['DELETE', 'GET', 'POST']).status(405).json({ error: 'Method Not Allowed' });
        }


        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (_error: any) {
        return res.status(500).json(errorGenerator(500, 'Internal server error.'));
    }
}

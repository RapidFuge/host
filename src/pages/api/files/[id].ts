import type { NextApiRequest, NextApiResponse } from 'next';
import { errorGenerator } from '@lib';
import * as generators from '@lib/generators';
import { Database, getDatabase } from '@lib/db';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { isAscii } from 'validator';
import mime from 'mime-types';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { File } from '@lib/models/file';

const removeExt = (str: string) => str.substring(0, str.indexOf('.'));

export const config = {
    api: {
        responseLimit: false
    }
}

// Video MIME types that should support streaming
const VIDEO_MIME_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime',
    'video/x-msvideo'
];

function parseRange(size: number, range: string) {
    const ranges = [];
    const rangeHeader = range.replace(/bytes=/, '').split(',');

    for (const rangeStr of rangeHeader) {
        const [startStr, endStr] = rangeStr.trim().split('-');
        const start = parseInt(startStr) || 0;
        const end = parseInt(endStr) || size - 1;

        if (start >= size || end >= size || start > end) {
            continue;
        }

        ranges.push({ start, end });
    }

    return ranges;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getDatabase();
    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    let user;
    if (session || authHeader) user = await db.getUserByToken(authHeader || session?.user.token);

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
                    return res.status(200).json({ success: true, message: "File expiry updated." });
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
                        ownerEmbedPreference: owner.embedImageDirectly ?? false,
                        ownerCustomDescription: owner.customEmbedDescription ?? null
                    });
                }

                const fileSize = file.size;
                if (!fileSize) {
                    console.error("File size is unknown for:", file.fileName);
                    return res.status(500).json(errorGenerator(500, 'Could not determine file size.'));
                }

                const downloadFilename = file.publicFileName || `${file.id}${file.extension ? `.${file.extension}` : ''}`;
                let Mime;
                if (file.extension === 'ts') {
                    Mime = 'text/typescript';
                } else if (file.extension === 'mp4') {
                    Mime = 'video/mp4';
                } else {
                    Mime = mime.lookup(file.fileName) || 'application/octet-stream';
                }

                const isVideo = VIDEO_MIME_TYPES.includes(Mime);
                const range = req.headers.range;

                res.setHeader("Content-Type", Mime);
                res.setHeader('Content-Disposition', `inline; filename="${downloadFilename}"`);

                if (isVideo) {
                    res.setHeader("Accept-Ranges", "bytes");
                    res.setHeader("Cache-Control", "public, max-age=3600");
                }

                if (isVideo && range) {
                    const ranges = parseRange(fileSize, range);
                    if (!ranges || ranges.length === 0) {
                        res.setHeader("Content-Range", `bytes */${fileSize}`);
                        return res.status(416).json(errorGenerator(416, 'Range Not Satisfiable'));
                    }

                    const { start, end } = ranges[0];
                    const chunkSize = (end - start) + 1;

                    res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
                    res.setHeader("Content-Length", chunkSize);
                    res.status(206); // Partial Content

                    const fullCachePath = path.join(os.tmpdir(), file.fileName);
                    const cachingPath = `${fullCachePath}.caching`;

                    if (fs.existsSync(fullCachePath)) {
                        try {
                            const cachedSize = (await fs.stat(fullCachePath)).size;
                            if (cachedSize === fileSize) {
                                const rangeStream = fs.createReadStream(fullCachePath, { start, end });
                                rangeStream.pipe(res);
                                return;
                            }
                        } catch {
                            fs.unlink(fullCachePath, () => { });
                        }
                    }

                    try {
                        const rangeStream = await db.imageDrive.get(file.fileName, { start, end });
                        rangeStream.pipe(res);

                        if (!fs.existsSync(cachingPath) && !fs.existsSync(fullCachePath)) {
                            setImmediate(() => cacheFullVideo(db, file, fullCachePath, cachingPath, fileSize));
                        }

                        return;
                    } catch (error) {
                        console.error("Could not get file range stream from storage:", error);
                        return res.status(500).json(errorGenerator(500, 'Could not retrieve file range from storage.'));
                    }
                }

                // Handle regular file requests (no range or non-video files)
                res.setHeader('Content-Length', fileSize);

                // For videos without range, check if we have it cached
                if (isVideo) {
                    const fullCachePath = path.join(os.tmpdir(), file.fileName);
                    if (fs.existsSync(fullCachePath)) {
                        try {
                            const cachedSize = (await fs.stat(fullCachePath)).size;
                            if (cachedSize === fileSize) {
                                fs.createReadStream(fullCachePath).pipe(res);
                                return;
                            }
                        } catch {
                            // If cache file is corrupted, delete it
                            fs.unlink(fullCachePath, () => { });
                        }
                    }
                }

                // For non-videos, try cache first
                if (!isVideo) {
                    const cachePath = path.join(os.tmpdir(), file.fileName);
                    if (fs.existsSync(cachePath)) {
                        fs.createReadStream(cachePath).pipe(res);
                        return;
                    }
                }

                try {
                    const stream = await db.imageDrive.get(file.fileName);

                    if (!isVideo) {
                        const cachePath = path.join(os.tmpdir(), file.fileName);
                        const cacheWriteStream = fs.createWriteStream(cachePath);
                        stream.pipe(res);
                        stream.pipe(cacheWriteStream);

                        cacheWriteStream.on('error', err => {
                            console.error('Error writing to cache:', err);
                            fs.unlink(cachePath, () => { });
                        });
                    } else {
                        const fullCachePath = path.join(os.tmpdir(), file.fileName);
                        const cachingPath = `${fullCachePath}.caching`;

                        if (!fs.existsSync(cachingPath) && !fs.existsSync(fullCachePath)) {
                            const cacheWriteStream = fs.createWriteStream(cachingPath);

                            stream.pipe(res);
                            stream.pipe(cacheWriteStream);

                            cacheWriteStream.on('finish', () => {
                                fs.rename(cachingPath, fullCachePath, (err) => {
                                    if (err) {
                                        console.error('Error finalizing video cache:', err);
                                        fs.unlink(cachingPath, () => { });
                                    } else {
                                        console.log(`VIDEO-CACHE --> Cached full video: ${file.fileName}`);
                                    }
                                });
                            });

                            cacheWriteStream.on('error', err => {
                                console.error('Error caching full video:', err);
                                fs.unlink(cachingPath, () => { });
                            });
                        } else {
                            // Just stream directly if already caching
                            stream.pipe(res);
                        }
                    }
                } catch (error) {
                    console.error("Could not get file stream from storage:", error);
                    return res.status(500).json(errorGenerator(500, 'Could not retrieve file from storage.'));
                }

                return;

            default:
                return res.setHeader('Allow', ['DELETE', 'GET', 'POST']).status(405).json({ error: 'Method Not Allowed' });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json(errorGenerator(500, 'Internal server error.'));
    }
}

async function cacheFullVideo(db: Database, file: File, fullCachePath: string, cachingPath: string, expectedSize: number) {
    try {
        console.log(`VIDEO-CACHE --> Starting background cache for: ${file.fileName}`);

        const fullStream = await db.imageDrive.get(file.fileName);
        const cacheWriteStream = fs.createWriteStream(cachingPath);

        fullStream.pipe(cacheWriteStream);

        cacheWriteStream.on('finish', async () => {
            try {
                const cachedSize = (await fs.stat(cachingPath)).size;
                if (cachedSize === expectedSize) {
                    await fs.rename(cachingPath, fullCachePath);
                    console.log(`VIDEO-CACHE --> Successfully cached full video: ${file.fileName} (${cachedSize} bytes)`);
                } else {
                    console.error(`VIDEO-CACHE --> Size mismatch for ${file.fileName}. Expected: ${expectedSize}, Got: ${cachedSize}`);
                    await fs.unlink(cachingPath);
                }
            } catch (err) {
                console.error('Error finalizing background video cache:', err);
                fs.unlink(cachingPath, () => { });
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cacheWriteStream.on('error', (err: any) => {
            console.error('Error during background video caching:', err);
            fs.unlink(cachingPath, () => { });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fullStream.on('error', (err: any) => {
            console.error('Error reading stream for background caching:', err);
            fs.unlink(cachingPath, () => { });
        });

    } catch (error) {
        console.error('Failed to start background video caching:', error);
        fs.unlink(cachingPath, () => { });
    }
}
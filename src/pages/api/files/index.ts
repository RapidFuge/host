import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File as FormidableFile } from 'formidable';
import { errorGenerator, getBase } from '@lib';
import * as generators from '@lib/generators';
import removeGPS from '@lib/removeGPS';
import fs from 'fs-extra';
import { getDatabase, Database } from '@lib/db';
import path from 'path';
import { ms } from 'humanize-ms';
import convert from 'heic-convert';
import os from 'os';
import { User } from '@lib/models/user';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';

export const config = {
    api: {
        bodyParser: false,
    },
};

async function processAndStoreFinalFile(
    tempFilepath: string,
    storageFilename: string,
    originalFilename: string | null,
    filesize: number,
    db: Database,
    user: User,
    isPrivate: boolean,
    keepOriginalName: boolean,
    expiresIn: string,
    req: NextApiRequest
) {
    await removeGPS(tempFilepath).catch(error => {
        console.error(`GPS removal failed for ${tempFilepath}:`, error);
    });

    let currentFilesize = filesize;
    let finalStorageFilename = storageFilename;

    const extSplit = storageFilename.split('.');
    let ext = extSplit.length > 1 ? extSplit.pop() : undefined;

    if ((ext?.toLowerCase() === 'heic' || ext?.toLowerCase() === 'heif') && !keepOriginalName) {
        const fileContent = await fs.readFile(tempFilepath);
        const originalExt = ext;
        ext = 'jpg';
        const convertedBuffer = await convert({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            buffer: (new Uint8Array(fileContent.buffer, fileContent.byteOffset, fileContent.byteLength)) as any,
            format: 'JPEG',
        });
        const finalBuffer = Buffer.from(convertedBuffer);
        currentFilesize = finalBuffer.length;
        finalStorageFilename = storageFilename.replace(new RegExp(`${originalExt}$`, 'i'), 'jpg');

        if (currentFilesize > 1024 * 1024 * 1024) {
            const convertedTempPath = `${tempFilepath}.converted.jpg`;
            await fs.writeFile(convertedTempPath, finalBuffer);
            await db.imageDrive.put(finalStorageFilename, convertedTempPath);
            await fs.unlink(convertedTempPath);
        } else {
            await db.imageDrive.put(finalStorageFilename, finalBuffer);
        }
    } else {
        if (filesize > 1024 * 1024 * 1024) {
            await db.imageDrive.put(finalStorageFilename, tempFilepath);
        } else {
            const fileContent = await fs.readFile(tempFilepath);
            await db.imageDrive.put(finalStorageFilename, fileContent);
        }
    }

    const id = generators[(user.shortener || 'random') as generators.shorteners](user.shortener === 'gfycat' ? 2 : 6);

    let expiresAt: Date | undefined = undefined;
    const expirationSetting = expiresIn || user.defaultFileExpiration;
    if (expirationSetting && expirationSetting !== 'never') {
        try {
            const duration = ms(expirationSetting);
            if (duration) expiresAt = new Date(Date.now() + duration);
        } catch (_) {
            console.warn(`Invalid expiration format: ${expirationSetting}`);
        }
    }

    const publicFileName = keepOriginalName && originalFilename ? originalFilename : (ext ? `${id}.${ext}` : id);

    await db.addFile(finalStorageFilename, id, ext, user.username, currentFilesize, isPrivate, publicFileName, expiresAt);

    const base = getBase(req);
    return {
        url: `${base}/${id}`,
        deletionUrl: `${base}/dashboard`,
    };
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.setHeader('Allow', ['POST']).status(405).json({ error: 'Method Not Allowed' });
    const db = await getDatabase();

    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    if (!session && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const userToken = authHeader ? authHeader : session?.user.token;
    if (!userToken) return res.status(401).json(errorGenerator(401, "Unauthorized: Token is invalid or missing."));

    const user = await db.getUserByToken(userToken);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    const isPrivate = req.headers.isprivate === 'true';
    const keepOriginalName = req.headers.keeporiginalname === 'true';
    const expiresIn = req.headers.expiresin as string;
    const uploadId = req.headers['x-upload-id'] as string;

    if (uploadId) {
        const chunksDir = path.join(os.tmpdir(), 'rapid-host-chunks');
        const uploadDir = path.join(chunksDir, uploadId);
        await fs.ensureDir(uploadDir);

        if (req.headers['x-finalize'] === 'true') {
            const totalChunks = parseInt(req.headers['x-total-chunks'] as string, 10);
            const originalFilename = req.headers['x-original-filename'] as string;

            const tok = generators.random(12);
            const split = originalFilename?.split('.') || [];
            let storageFilename: string;
            if (split.length > 1) {
                const ext = split.pop();
                storageFilename = (ext?.length || 0) > 10 ? tok : `${tok}.${ext}`;
            } else {
                storageFilename = tok;
            }

            const assembledFilePath = path.join(os.tmpdir(), storageFilename);

            try {
                const writeStream = fs.createWriteStream(assembledFilePath);
                const chunkReader = new PassThrough();

                const pipelinePromise = pipeline(chunkReader, writeStream);

                for (let i = 0; i < totalChunks; i++) {
                    const chunkPath = path.join(uploadDir, `chunk-${i}`);

                    if (!await fs.pathExists(chunkPath)) {
                        chunkReader.destroy(new Error(`Missing chunk: ${i}`));
                        throw new Error(`Missing chunk: ${i}`);
                    }

                    const readStream = fs.createReadStream(chunkPath, {
                        highWaterMark: 64 * 1024 // 64KB chunks to prevent memory issues
                    });

                    await new Promise((resolve, reject) => {
                        readStream.on('data', (chunk) => {
                            if (!chunkReader.write(chunk)) {
                                readStream.pause();
                                chunkReader.once('drain', () => readStream.resume());
                            }
                        });

                        readStream.on('end', () => {
                            resolve(void 0);
                        });

                        readStream.on('error', reject);
                    });

                    await fs.remove(chunkPath).catch(err =>
                        console.warn(`Failed to delete chunk ${i}:`, err)
                    );
                }

                chunkReader.end();

                await pipelinePromise;

                await fs.remove(uploadDir).catch(err =>
                    console.warn(`Failed to remove upload directory:`, err)
                );

                const stats = await fs.stat(assembledFilePath);
                const result = await processAndStoreFinalFile(
                    assembledFilePath, storageFilename, originalFilename, stats.size,
                    db, user, isPrivate, keepOriginalName, expiresIn, req
                );

                return res.status(200).json(result);

            } catch (error) {
                console.error("Chunked file processing failed:", error);
                return res.status(500).json(errorGenerator(500, `Failed to process chunked file: ${(error as Error).message}`));
            }
        } else {
            const chunkIndex = req.headers['x-chunk-index'] as string;
            const chunkPath = path.join(uploadDir, `chunk-${chunkIndex}`);
            const writeStream = fs.createWriteStream(chunkPath);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await new Promise((resolve: any, reject) => {
                req.pipe(writeStream);
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });
            return res.status(200).json({ success: true });
        }
    } else {
        const form = formidable({
            maxFileSize: (10 * 1024 * 1024 * 1024),
            keepExtensions: true,
            filename: (name, ext, part) => {
                const originalName = part.originalFilename;
                const tok = generators.random(12);
                const split = originalName?.split('.') || [];
                if (split.length > 1) {
                    const ext = split.pop();
                    return (ext?.length || 0) > 10 ? tok : `${tok}.${ext}`;
                }
                return tok;
            }
        });

        return form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Formidable parsing error:", err);
                return res.status(400).json(errorGenerator(400, "Failed to process file upload."));
            }

            let filesToProcess: FormidableFile[] = [];
            if (files.files) {
                filesToProcess = Array.isArray(files.files) ? files.files : [files.files];
            }

            if (filesToProcess.length === 0) {
                return res.status(400).json(errorGenerator(400, "No file upload detected with field name 'files'!"));
            }

            const results = [];
            for (const file of filesToProcess) {
                try {
                    const result = await processAndStoreFinalFile(
                        file.filepath, file.newFilename, file.originalFilename, file.size,
                        db, user, isPrivate, keepOriginalName, expiresIn, req
                    );
                    results.push(result);
                } catch (uploadError) {
                    console.error(`Error processing file ${file.originalFilename}:`, uploadError);
                }
            }

            if (results.length === 0) return res.status(500).json(errorGenerator(500, "All files failed to process."));

            return res.status(200).json({ ...results[0], files: results });
        });
    }
}

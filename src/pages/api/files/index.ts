// api/files/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import formidable, { File as FormidableFile } from 'formidable'; // Import File type from formidable
import { errorGenerator, getBase } from '@lib';
import * as generators from '@lib/generators';
import removeGPS from '@lib/removeGPS';
import fs from 'fs-extra';
import { getDatabase } from '@lib/db';
import path from 'path';
import { ms } from 'humanize-ms';
import lib from '@myunisoft/heif-converter';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.setHeader('Allow', ['POST']).status(405).json({ error: 'Method Not Allowed' });
    const db = await getDatabase();

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    if (!token && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const userToken = authHeader ? authHeader : token?.token;
    if (!userToken) return res.status(401).json(errorGenerator(401, "Unauthorized: Token is invalid or missing."));

    const user = await db.getUserByToken(userToken);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    const form = formidable({
        maxFileSize: (1 * 1024 * 1024 * 1024),
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
    const isPrivate = req.headers.isprivate === 'true' || req.headers.isPrivate === "true"; // More robust check
    const keepOriginalName = req.headers.keeporiginalname === 'true' || req.headers.keepOriginalName === 'true';
    const expiresIn = req.headers.expiresin as string;

    return form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error("Formidable parsing error:", err);
            return res.status(400).json(errorGenerator(400, "Failed to process file upload."));
        }

        // Normalize 'files.files' to always be an array of FormidableFile
        let filesToProcess: FormidableFile[] = [];
        if (files.files) {
            filesToProcess = Array.isArray(files.files) ? files.files : [files.files];
        }

        if (filesToProcess.length === 0) {
            return res.status(400).json(errorGenerator(400, "No file upload detected with field name 'files'!"));
        }

        const results = []; // To store results if you want to send multiple URLs back

        for (const file of filesToProcess) {
            if (!file) continue; // Should not happen if filesToProcess is constructed correctly

            try {

                await removeGPS(file.filepath)
                    .then(result => {
                        console.log(`GPS removal successful for ${file.filepath}: ${result}`);
                    })
                    .catch(error => {
                        console.error(`GPS removal failed for ${file.filepath}:`, error);
                    });

                let fileContent: Buffer = await fs.readFile(file.filepath);
                let fileSizeInBytes = fileContent.length;

                let filename = path.basename(file.filepath);
                const extSplit = filename.split('.');
                let ext = extSplit.length > 1 ? extSplit.pop() : undefined;
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

                if (ext?.toLowerCase() === 'heic' || ext?.toLowerCase() === 'heif') {
                    ext = 'png';
                    const convertedBuffer = await lib.toPng(fileContent);
                    fileContent = convertedBuffer;
                    fileSizeInBytes = convertedBuffer.length;
                    filename = filename.replace(/heic$/i, 'png').replace(/heif$/i, 'png');
                }

                const publicFileName = keepOriginalName && file.originalFilename ? file.originalFilename.replace(/heic$/i, 'png').replace(/heif$/i, 'png') : (ext ? `${id}.${ext}` : id);

                await db.imageDrive.put(filename, fileContent);
                await db.addFile(filename, id, ext, user.username, fileSizeInBytes, isPrivate, publicFileName, expiresAt);

                const base = getBase(req);
                results.push({
                    url: `${base}/${id}`,
                    deletionUrl: `${base}/dashboard`,
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (uploadError: any) {
                console.error(`Error processing file ${file.originalFilename}:`, uploadError);
                if (results.length === 0 && filesToProcess.indexOf(file) === filesToProcess.length - 1) {
                    return res.status(500).json(errorGenerator(500, `Failed to process file: ${file.originalFilename}. ${uploadError.message}`));
                }
            }
        }

        if (results.length === 0) return res.status(500).json(errorGenerator(500, "All files failed to process."));

        return res.status(200).json({ ...results[0], files: results });
    });
}

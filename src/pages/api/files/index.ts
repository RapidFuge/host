// api/files/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import formidable, { File as FormidableFile } from 'formidable'; // Import File type from formidable
import { errorGenerator, getBase } from '@lib';
import * as generators from '@lib/generators';
import removeGPS from '@lib/removeGPS';
import fs from 'fs-extra';
import { getDatabase } from '@lib/db';

export const config = {
    api: {
        bodyParser: false,
    },
};

const genFileName = async (originalname: string | null): Promise<string> => {
    const tok = await generators.random(12);
    const split = originalname?.split('.') || [];
    if (split.length > 1) {
        const ext = split.pop();
        return (ext?.length || 0) > 5 ? tok : `${tok}.${ext}`;
    }
    return tok;
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

    const form = formidable({ multiples: true });
    const isPrivate = Boolean(req.headers.isprivate === 'true' || req.headers.isPrivate === "true"); // More robust check

    // formidable v2/v3 types: files is an object, not an array directly
    // files.files will be an array if multiple files are uploaded with the same field name "files"
    // or a single File object if only one file is uploaded with that name.
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
                await removeGPS(file.filepath).catch((gpsError) => {
                    console.warn(`GPS removal failed for ${file.originalFilename}: ${gpsError.message}`);
                    // Decide if this is a critical error or if you want to continue
                });

                const fileContent = await fs.readFile(file.filepath);
                const fileSizeInBytes = fileContent.length; // <--- GET FILE SIZE HERE

                let filename = await genFileName(file.originalFilename);
                const extSplit = filename.split('.');
                let ext = extSplit.length > 1 ? extSplit.pop() : undefined;
                const id = generators[(user.shortener || 'random') as generators.shorteners](user.shortener === 'gfycat' ? 2 : 6);

                if (ext?.toLowerCase() === 'heic') {
                    filename = filename.replace(/heic$/i, 'jpg');
                    ext = 'jpg'
                }

                await db.imageDrive.put(filename, fileContent);
                await db.addFile(filename, id, ext, user.username, fileSizeInBytes, isPrivate);

                const base = getBase(req);
                results.push({
                    url: `${base}/${id}`,
                    deletionUrl: `${base}/dashboard`,
                });

            } catch (uploadError: any) {
                console.error(`Error processing file ${file.originalFilename}:`, uploadError);
                if (results.length === 0 && filesToProcess.indexOf(file) === filesToProcess.length - 1) {
                    return res.status(500).json(errorGenerator(500, `Failed to process file: ${file.originalFilename}. ${uploadError.message}`));
                }
            } finally {
                if (file && file.filepath) {
                    await fs.unlink(file.filepath).catch(unlinkErr => console.error(`Failed to delete temp file ${file.filepath}:`, unlinkErr));
                }
            }
        }

        if (results.length === 0) return res.status(500).json(errorGenerator(500, "All files failed to process."));

        return res.status(200).json({ ...results[0], files: results });
    });
}
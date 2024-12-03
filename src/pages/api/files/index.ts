import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import formidable from 'formidable';
import { errorGenerator, getBase } from '@lib';
import * as generators from '@lib/generators';
import removeGPS from '@lib/removeGPS';
import fs from 'fs-extra';
import db from '@lib/db';

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

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    if (!token && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || token?.token);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    const form = formidable({ multiples: true });
    const isPrivate = Boolean(req.headers.isPrivate);

    return form.parse(req, async (err, _fields, files) => {
        if (err) return res.status(400).json(errorGenerator(400, "Failed to process file upload."));

        const uploadedFiles = Array.isArray(files.files) ? files.files : [files.files];
        if (!uploadedFiles.length) return res.status(400).json(errorGenerator(400, "No file upload detected!"));

        let responseSent = false;

        for (const file of uploadedFiles) {
            // If this is not included, it will error saying file might be undefined.
            if (!file) continue;
            await removeGPS(file.filepath).catch(() => false);
            const fileContent = await fs.readFile(file.filepath);
            let filename = await genFileName(file.originalFilename);
            const ext = filename.split('.').pop();
            const id = generators[user.shortener || 'random'](user.shortener === 'gfycat' ? 2 : 6);

            if (ext?.toLowerCase() === 'heic') filename = filename.replace(/heic$/i, 'jpg');

            await db.imageDrive.put(filename, fileContent);
            await db.addFile(filename, id, ext || undefined, user.username, isPrivate);

            if (!responseSent) {
                responseSent = true;
                const base = getBase(req);
                res.status(200).json({
                    url: `${base}/${id}`,
                    deletionUrl: `${base}/dashboard`,
                });
            }
        }
    });
}

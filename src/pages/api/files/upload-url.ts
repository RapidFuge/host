import type { NextApiRequest, NextApiResponse } from 'next';
import { errorGenerator, getBase } from '@lib';
import * as generators from '@lib/generators';
import removeGPS from '@lib/removeGPS';
import fs from 'fs-extra';
import { getDatabase } from '@lib/db';
import { ms } from 'humanize-ms';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import LocalStorageClient from '@lib/local';
import path from 'path';
import os from 'os';

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

    const { url, isPrivate: reqPrivate, keepOriginalName: reqKeepName, expiresIn } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json(errorGenerator(400, "URL is required."));

    const isPrivate = reqPrivate === true;
    const keepOriginalName = reqKeepName === true;

    let remoteResponse: Response;
    try {
        remoteResponse = await fetch(url, {
            redirect: 'follow',
            headers: { 'User-Agent': 'RapidHost/7.0.0' },
        });
    } catch {
        return res.status(400).json(errorGenerator(400, "Failed to fetch the remote URL."));
    }

    if (!remoteResponse.ok) {
        return res.status(400).json(errorGenerator(400, `Remote URL returned status ${remoteResponse.status}`));
    }

    const contentLength = parseInt(remoteResponse.headers.get('content-length') || '0', 10);
    if (contentLength > 10 * 1024 * 1024 * 1024) {
        return res.status(400).json(errorGenerator(400, "Remote file exceeds 10 GB limit."));
    }

    const urlPath = new URL(url).pathname;
    const urlFilename = decodeURIComponent(urlPath.split('/').pop() || 'download');
    const tok = generators.random(12);
    const split = urlFilename.split('.');
    const ext = split.length > 1 ? split.pop() : undefined;
    const storageFilename = (ext && ext.length <= 10) ? `${tok}.${ext}` : tok;

    const tempPath = path.join(os.tmpdir(), storageFilename);

    try {
        const arrayBuffer = await remoteResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(tempPath, buffer);

        await removeGPS(tempPath).catch(() => {});

        const currentFilesize = buffer.length;

        let expiresAt: Date | undefined = undefined;
        const expirationSetting = expiresIn || user.defaultFileExpiration;
        if (expirationSetting && expirationSetting !== 'never') {
            try {
                const duration = ms(expirationSetting);
                if (duration) expiresAt = new Date(Date.now() + duration);
            } catch (_) {}
        }

        const id = generators[(user.shortener || 'random') as generators.shorteners](user.shortener === 'gfycat' ? 2 : 6);
        const publicFileName = keepOriginalName ? urlFilename : (ext ? `${id}.${ext}` : id);

        if (currentFilesize > 1024 * 1024 * 1024) {
            await db.imageDrive.put(storageFilename, tempPath);
        } else {
            await db.imageDrive.put(storageFilename, buffer);
        }

        await db.addFile(storageFilename, id, ext, user.username, currentFilesize, isPrivate, publicFileName, expiresAt, 'file');

        if (db.imageDrive instanceof LocalStorageClient) {
            await fs.unlink(tempPath).catch(() => {});
        }

        const base = getBase(req);
        return res.status(200).json({ url: `${base}/${id}`, deletionUrl: `${base}/dashboard` });
    } catch (error) {
        console.error('URL upload error:', error);
        await fs.unlink(tempPath).catch(() => {});
        return res.status(500).json(errorGenerator(500, 'Failed to process remote file.'));
    }
}

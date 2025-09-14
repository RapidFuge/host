import { isEmpty, isAscii } from 'validator';
import { NextApiRequest, NextApiResponse } from 'next';
import { errorGenerator } from '@lib';
import * as generators from '@lib/generators';
import { getDatabase } from '@lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import isURL from 'validator/lib/isURL';

const validTag = (tag: string) => typeof tag === "string" && !isEmpty(tag) && (isAscii(tag) || generators.checkIfZws(tag));

export async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getDatabase();
    const { tag } = req.query;

    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    let user;
    if ((session || authHeader) && ["DELETE", "PUT"].includes(req.method as string)) user = await db.getUserByToken(session?.user.token || authHeader);
    if (!validTag(tag as string)) return res.status(400).json(errorGenerator(400, "Invalid short URL tag."));

    const link = await db.getLink(tag as string);
    if (!link) return res.status(404).json(errorGenerator(404, "Link tag not found."));

    try {
        switch (req.method) {
            case "DELETE":
                if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
                if ((link?.owner !== user?.username) && !user?.isAdmin) return res.status(403).json(errorGenerator(403, "You are not allowed to delete that link."));

                await db.removeLink(tag as string);
                return res.json({ success: true, message: "Link removed!" });
            case "PUT": {
                if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
                if ((link?.owner !== user?.username) && !user?.isAdmin) return res.status(403).json(errorGenerator(403, "You are not allowed to edit that link."));

                const { url: newUrl, tag: newTag } = req.body;

                if (!newUrl && !newTag) {
                    return res.status(400).json(errorGenerator(400, "No new URL or tag provided for update."));
                }

                const updates: { url?: string; id?: string } = {};

                if (newUrl) {
                    if (typeof newUrl !== 'string' || !isURL(newUrl)) {
                        return res.status(400).json(errorGenerator(400, "Invalid URL format provided."));
                    }
                    updates.url = newUrl;
                }

                if (newTag && newTag !== tag) {
                    if (!validTag(newTag)) {
                        return res.status(400).json(errorGenerator(400, "The new tag has an invalid format."));
                    }
                    const existingLink = await db.getLink(newTag);
                    if (existingLink) {
                        return res.status(409).json(errorGenerator(409, "The new tag is already in use."));
                    }
                    updates.id = newTag;
                }

                await db.setLink(tag as string, updates);

                return res.json({ success: true, message: "Link updated successfully!" });
            }
            case "GET":
                return res.json({ success: true, link: link.toJSON() });
            default:
                return res.setHeader('Allow', ['DELETE', 'GET']).status(405).json({ error: 'Method Not Allowed' });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export default handler;
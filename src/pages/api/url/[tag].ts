import { isEmpty, isAscii } from 'validator';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { errorGenerator } from '@lib';
import * as generators from '@lib/generators';
import { getDatabase } from '@lib/db';

const validTag = (tag: string) => typeof tag === "string" && !isEmpty(tag) && (isAscii(tag) || generators.checkIfZws(tag));

export async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getDatabase();
    const { query } = req;
    const { tag } = query;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    let user;
    if ((token || authHeader) && req.method === "DELETE") user = await db.getUserByToken(token?.token || authHeader);
    if (!validTag(tag as string)) return res.status(400).json(errorGenerator(400, "Invalid short URL tag."));

    const link = await db.getLink(tag as string);
    if (!link) return res.status(404).json(errorGenerator(404, "Link tag not found."));

    try {
        switch (req.method) {
            case "DELETE":
                if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
                if (link?.owner !== user?.username || !user?.isAdmin) return res.status(403).json(errorGenerator(403, "You are not allowed to delete that link."));

                await db.removeLink(tag as string);
                return res.json({ success: true, message: "Link removed!" });
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
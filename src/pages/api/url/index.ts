import { NextApiRequest, NextApiResponse } from 'next';
import { errorGenerator, getBase } from '@lib';
import { getDatabase } from '@lib/db';
import { isURL, trim } from 'validator';
import * as generators from '@lib/generators';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const validTag = (tag: string) => typeof tag === "string" && tag.length > 2 && tag.length < 69;

export async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.setHeader('Allow', ['POST']).status(405).json({ error: 'Method Not Allowed' });
    const { body, headers } = req;
    const db = await getDatabase();

    try {
        const session = await getServerSession(req, res, authOptions);
        const authHeader = req.headers.authorization;

        const user = await db.getUserByToken(authHeader || session?.user.token);
        if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));

        const url = headers['shorten-url'] as string;
        if (!url || typeof url !== 'string' || !isURL(url)) {
            return res.status(400).json(errorGenerator(400, 'Bad request: Header "shorten-url" must be provided and be a url.'));
        };

        const providedTag = body.tag;
        const generator: generators.shorteners = body.shortener || "random";
        const isValid = validTag(providedTag);
        const inUse = await db.getLink(providedTag);

        const tag = (isValid && !inUse) ? providedTag : generators[generator](generator === 'gfycat' ? 2 : 6);
        await db.addLink(tag, trim(url), user.username);

        return res.status(200).json({ success: true, url: `${getBase(req)}/${tag}` });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export default handler;

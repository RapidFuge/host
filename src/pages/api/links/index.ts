import { NextApiRequest, NextApiResponse } from 'next';
import { errorGenerator, getBase } from '@lib';
import { getDatabase } from '@lib/db';
import { isURL, trim, isAscii } from 'validator';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const validTag = (tag: string) => typeof tag === "string" && tag.length > 2 && tag.length < 69 && isAscii(tag) && isURL(tag) !== true; // Make sure it's not a URL, has proper length and ASCII chars

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
        const isValid = validTag(providedTag);

        if (!isValid) {
            return res.status(400).json(errorGenerator(400, 'Invalid tag format. Tag must be 3-68 ASCII characters long.'));
        }

        const linkInUse = await db.getLink(providedTag);
        const pasteTagInUse = await db.getPasteTag(providedTag); // Check if tag conflicts with existing paste tag

        // Check if the tag points to an existing resource (not orphaned)
        let isOrphaned = false;
        if (linkInUse) {
            // For links, we consider them active as we can't easily verify if the target URL is still valid
            return res.status(409).json(errorGenerator(409, 'Tag already in use by another URL shortener.'));
        } else if (pasteTagInUse) {
            // Check if the paste the tag points to still exists
            const targetPaste = await db.getFile(pasteTagInUse.pasteId);
            if (!targetPaste) {
                // The tag points to a non-existent paste, so it's orphaned
                isOrphaned = true;
            } else {
                return res.status(409).json(errorGenerator(409, 'Tag already in use by a paste.'));
            }
        }

        // If tag exists but is orphaned (for paste tags), remove the old tag first
        if (isOrphaned) {
            await db.removePasteTag(providedTag);
        }

        // Use the provided tag since validation passed
        await db.addLink(providedTag, trim(url), user.username);

        return res.status(200).json({ success: true, url: `${getBase(req)}/${providedTag}` });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export default handler;

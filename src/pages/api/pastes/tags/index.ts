import { NextApiRequest, NextApiResponse } from 'next';
import { errorGenerator, getBase } from '@lib';
import { getDatabase } from '@lib/db';
import { isAscii, isEmpty } from 'validator';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

const validTag = (tag: string) => typeof tag === "string" && tag.length > 2 && tag.length < 69 && isAscii(tag) && !isEmpty(tag);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.setHeader('Allow', ['POST']).status(405).json({ error: 'Method Not Allowed' });
    
    const { body } = req;
    const db = await getDatabase();

    try {
        const session = await getServerSession(req, res, authOptions);
        const authHeader = req.headers.authorization;

        const user = await db.getUserByToken(authHeader || session?.user.token);
        if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));

        const pasteId = req.headers['paste-id'] as string;
        if (!pasteId || typeof pasteId !== 'string') {
            return res.status(400).json(errorGenerator(400, 'Bad request: Header "paste-id" must be provided.'));
        }

        // Verify that the paste exists and belongs to the user
        const paste = await db.getFile(pasteId);
        if (!paste) {
            return res.status(404).json(errorGenerator(404, 'Paste not found.'));
        }
        
        if (paste.owner !== user.username && !user.isAdmin) {
            return res.status(403).json(errorGenerator(403, 'Forbidden: You do not own this paste.'));
        }

        if (paste.fileType !== 'paste') {
            return res.status(400).json(errorGenerator(400, 'This is not a paste file.'));
        }

        const providedTag = body.tag;
        const isValid = validTag(providedTag);

        if (!isValid) {
            return res.status(400).json(errorGenerator(400, 'Invalid tag format. Tag must be 3-68 ASCII characters long.'));
        }

        // Check if tag already exists
        const tagInUse = await db.getPasteTag(providedTag);
        const linkInUse = await db.getLink(providedTag); // Check if tag conflicts with existing link

        // Check if the tag points to an existing resource (not orphaned)
        let isOrphaned = false;
        if (tagInUse) {
            // Check if the paste the tag points to still exists
            const targetPaste = await db.getFile(tagInUse.pasteId);
            if (!targetPaste) {
                // The tag points to a non-existent paste, so it's orphaned
                isOrphaned = true;
            }
        } else if (linkInUse) {
            // For links, we can't easily check if target URL is still valid, so we consider it active
            return res.status(409).json(errorGenerator(409, 'Tag already in use by a URL shortener.'));
        }

        if (tagInUse && !isOrphaned) {
            return res.status(409).json(errorGenerator(409, 'Tag already in use by another paste.'));
        }

        // If tag exists but is orphaned, remove the old tag first
        if (isOrphaned) {
            await db.removePasteTag(providedTag);
        }

        // Use the provided tag since validation passed
        await db.addPasteTag(providedTag, pasteId, user.username);
        return res.status(200).json({ success: true, url: `${getBase(req)}/${providedTag}` });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Paste tag creation error:', error);
        return res.status(500).json({ error: error.message });
    }
}
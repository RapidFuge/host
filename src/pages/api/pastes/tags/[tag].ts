import { isEmpty, isAscii } from 'validator';
import { NextApiRequest, NextApiResponse } from 'next';
import { errorGenerator } from '@lib';
import * as generators from '@lib/generators';
import { getDatabase } from '@lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

const validTag = (tag: string) => typeof tag === "string" && !isEmpty(tag) && (isAscii(tag) || generators.checkIfZws(tag));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await getDatabase();
    const { tag } = req.query;

    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    let user;
    if ((session || authHeader) && ["DELETE", "PUT"].includes(req.method as string)) {
        user = await db.getUserByToken(session?.user.token || authHeader);
    }
    
    if (!validTag(tag as string)) {
        return res.status(400).json(errorGenerator(400, "Invalid paste tag."));
    }

    const pasteTag = await db.getPasteTag(tag as string);
    if (!pasteTag) {
        return res.status(404).json(errorGenerator(404, "Paste tag not found."));
    }

    try {
        switch (req.method) {
            case "DELETE":
                if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
                if ((pasteTag?.owner !== user?.username) && !user?.isAdmin) {
                    return res.status(403).json(errorGenerator(403, "You are not allowed to delete that paste tag."));
                }

                await db.removePasteTag(tag as string);
                return res.json({ success: true, message: "Paste tag removed!" });
                
            case "PUT": {
                if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
                if ((pasteTag?.owner !== user?.username) && !user?.isAdmin) {
                    return res.status(403).json(errorGenerator(403, "You are not allowed to edit that paste tag."));
                }

                const { pasteId: newPasteId, tag: newTag } = req.body;

                if (!newPasteId && !newTag) {
                    return res.status(400).json(errorGenerator(400, "No new paste ID or tag provided for update."));
                }

                if (newPasteId) {
                    // Verify that the new paste exists and belongs to the user
                    const paste = await db.getFile(newPasteId);
                    if (!paste) {
                        return res.status(404).json(errorGenerator(404, 'Paste not found.'));
                    }
                    
                    if (paste.owner !== user.username && !user.isAdmin) {
                        return res.status(403).json(errorGenerator(403, 'Forbidden: You do not own this paste.'));
                    }

                    if (paste.fileType !== 'paste') {
                        return res.status(400).json(errorGenerator(400, 'This is not a paste file.'));
                    }
                }

                const updates: { tag?: string; pasteId?: string } = {};

                if (newTag && newTag !== tag) {
                    if (!validTag(newTag)) {
                        return res.status(400).json(errorGenerator(400, "The new tag has an invalid format."));
                    }

                    const existingPasteTag = await db.getPasteTag(newTag);
                    const existingLink = await db.getLink(newTag);

                    // Check if the tag points to an existing resource (not orphaned)
                    let isOrphaned = false;
                    if (existingPasteTag) {
                        // Check if the paste the tag points to still exists
                        const targetPaste = await db.getFile(existingPasteTag.pasteId);
                        if (!targetPaste) {
                            // The tag points to a non-existent paste, so it's orphaned
                            isOrphaned = true;
                        }
                    } else if (existingLink) {
                        // For links, we consider them active as we can't easily verify if the target URL is still valid
                        return res.status(409).json(errorGenerator(409, "The new tag is already in use by a URL shortener."));
                    }

                    if (existingPasteTag && !isOrphaned) {
                        return res.status(409).json(errorGenerator(409, "The new tag is already in use by another paste."));
                    }

                    // If tag exists but is orphaned, remove the old tag first
                    if (isOrphaned) {
                        await db.removePasteTag(newTag);
                    }

                    updates.tag = newTag;
                }

                if (newPasteId) {
                    updates.pasteId = newPasteId;
                }

                await db.setPasteTag(tag as string, updates);

                return res.json({ success: true, message: "Paste tag updated successfully!" });
            }
            case "GET":
                // Return paste ID for redirect purposes
                return res.json({ 
                    success: true, 
                    pasteTag: {
                        ...pasteTag.toJSON(),
                        pasteId: pasteTag.pasteId
                    } 
                });
            default:
                return res.setHeader('Allow', ['DELETE', 'GET', 'PUT']).status(405).json({ error: 'Method Not Allowed' });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
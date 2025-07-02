import type { NextApiRequest, NextApiResponse } from "next";
import { errorGenerator } from "@lib/";
import { getDatabase } from '@lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const db = await getDatabase();

    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    if (!session && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || session?.user.token);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    switch (req.method) {
        case "DELETE":
            if (id !== user.username && !user.isAdmin) return res.status(403).json(errorGenerator(403, "Forbidden"));
            if (id === 'root' && process.env.PREVENT_ROOT_DELETION === "true") return res.status(400).json(errorGenerator(400, "Admin user cannot be deleted."));

            await db.removeUser(id as string);
            return res.json({ success: true, message: "User deleted." });

        case "GET":
            if ((id !== user.username) && !user.isAdmin) return res.status(403).json(errorGenerator(403, "Forbidden"));
            const targetUser = await db.getUser(id as string);
            return res.json({ success: true, user: targetUser });

        default:
            return res.setHeader('Allow', ['DELETE', 'GET']).status(405).json(errorGenerator(405, "Method not allowed"));
    }
};

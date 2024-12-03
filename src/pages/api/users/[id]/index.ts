import type { NextApiRequest, NextApiResponse } from "next";
import { errorGenerator } from "@lib/";
import db from "@lib/db";
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    if (!token && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || token?.token);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    switch (req.method) {
        case "DELETE":
            if (!user.isAdmin) return res.status(403).json(errorGenerator(403, "Forbidden"));
            if (id === process.env.ADMIN_USER && process.env.PREVENT_ROOT_DELETION === "true") return res.status(400).json(errorGenerator(400, "Admin user cannot be deleted."));

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

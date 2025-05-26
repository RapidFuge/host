import { NextApiRequest, NextApiResponse } from "next";
import { getDatabase } from '@lib/db';
import { errorGenerator } from "@lib";
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const db = await getDatabase();

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    if (!token && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || token?.token);
    if (!user || (id !== user.username && !user.isAdmin)) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    const links = await db.getLinks(id as string);

    return res.json({
        success: true,
        links
    });
}

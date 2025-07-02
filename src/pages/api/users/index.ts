import type { NextApiRequest, NextApiResponse } from "next";
import { errorGenerator } from "@lib";
import { getDatabase } from '@lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") return res.setHeader('Allow', ['GET']).status(405).json(errorGenerator(405, "Method not allowed"));
    const db = await getDatabase();

    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    if (!session && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || session?.user.token);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const users = await db.getUsers();
    return res.json({ users, success: true });
};
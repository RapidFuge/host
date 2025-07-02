import { NextApiRequest, NextApiResponse } from "next";
import { getDatabase } from '@lib/db';
import { errorGenerator } from "@lib";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const db = await getDatabase();

    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    if (!session && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || session?.user.token);
    if (!user || (id !== user.username && !user.isAdmin)) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    const links = await db.getLinks(id as string);

    return res.json({
        success: true,
        links
    });
}

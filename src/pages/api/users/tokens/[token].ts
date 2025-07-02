import type { NextApiRequest, NextApiResponse } from "next";
import { errorGenerator } from "@lib";
import { getDatabase } from '@lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") return res.setHeader('Allow', ['DELETE']).status(405).json(errorGenerator(405, "Method not allowed"));
    const db = await getDatabase();

    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    if (!session && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || session?.user.token);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const signUpToken = req.query.token;
    if (!signUpToken) return res.status(400).json(errorGenerator(400, "Token is not specified!"));

    await db.removeSignUpToken(signUpToken as string);
    return res.send({ success: true });
};

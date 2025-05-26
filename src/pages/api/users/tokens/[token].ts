import type { NextApiRequest, NextApiResponse } from "next";
import { errorGenerator } from "@lib";
import { getDatabase } from '@lib/db';
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") return res.setHeader('Allow', ['DELETE']).status(405).json(errorGenerator(405, "Method not allowed"));
    const db = await getDatabase();

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    if (!token && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || token?.token);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const signUpToken = req.query.token;
    if (!signUpToken) return res.status(400).json(errorGenerator(400, "Token is not specified!"));

    await db.removeSignUpToken(signUpToken as string);
    return res.send({ success: true });
};

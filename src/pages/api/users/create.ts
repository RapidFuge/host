import type { NextApiRequest, NextApiResponse } from "next";
import { hashRounds, errorGenerator, generateToken } from "@lib";
import { getDatabase } from '@lib/db';
import { hash } from "bcrypt";
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const validUsername = (str: string) => str && typeof str === "string" && str.length >= 3 && str.length <= 50 && /^[a-z0-9]+$/i.test(str);
const validPassword = (str: string) => str && typeof str === "string" && str.length >= 3 && str.length <= 100;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.setHeader('Allow', ['POST']).status(405).json(errorGenerator(405, "Method not allowed"));
    const db = await getDatabase();

    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    if (!session && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || session?.user.token);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const { username, password } = req.body;
    if (!validUsername(username)) return res.status(400).json(errorGenerator(400, "Invalid username."));
    if (!validPassword(password)) return res.status(400).json(errorGenerator(400, "Invalid password."));

    const existingUser = await db.getUser(username);
    if (existingUser) return res.status(400).json(errorGenerator(400, "Username is already in use."));

    const hashed = await hash(password, hashRounds);
    const userToken = await generateToken();
    await db.addUser(username, hashed, userToken);

    res.json({ success: true, username });
};

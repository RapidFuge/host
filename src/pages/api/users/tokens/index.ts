import type { NextApiRequest, NextApiResponse } from "next";
import * as generators from '@lib/generators';
import { errorGenerator } from "@lib";
import { getDatabase } from '@lib/db';
import { ms } from 'humanize-ms';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    const authHeader = req.headers.authorization;
    if (!session && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const db = await getDatabase();

    const user = await db.getUserByToken(authHeader || session?.user.token);
    if (!user) return res.status(401).json(errorGenerator(401, "Unauthorized."));
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    switch (req.method) {
        case "GET":
            const tokens = await db.getSignUpTokens();
            return res.json({ success: true, tokens });
        case "POST":
            const { expires } = req.headers;
            if (!expires || isNaN(ms(expires))) return res.status(400).send(errorGenerator(400, "Invalid expiration date!"));
            const allowedGenerators = [
                {
                    name: "gfycat",
                    length: 4
                },
                {
                    name: "random",
                    length: 32
                },
                {
                    name: "nanoid",
                    length: 32
                },
            ];

            const selected = allowedGenerators[Math.floor(Math.random() * allowedGenerators.length)];
            const token = generators[(selected.name as generators.shorteners)](selected.length);
            await db.addSignUpToken(token, ms(expires));

            return res.send({
                success: true,
                token: { token, expires }
            })
        default:
            return res.setHeader('Allow', ['POST', 'GET']).status(405).json(errorGenerator(405, "Method not allowed"));
    }
};

import { NextApiRequest, NextApiResponse } from "next";
import db from "@lib/db";
import { errorGenerator } from "@lib";
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const page = parseInt(req.query.page as string, 10) || 0;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    if (!token && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || token?.token);
    if (!user || (id !== user.username && !user.isAdmin)) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    if (isNaN(page) || page < 0) return res.status(400).json(errorGenerator(400, "Invalid page number"));

    const { files, totalPages } = await db.getUserFiles(id as string, page);

    return res.json({
        success: true,
        files,
        totalPages,
        currentPage: page
    });
}

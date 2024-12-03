// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import db from "@lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const runningHours = process.uptime() / (60 * 60);
  const uptime = Math.floor(runningHours * 10) / 10;

  const files = await db.getFiles();
  const uploads = files.length;

  return res.status(200).json({ uptime, uploads })
}

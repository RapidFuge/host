import { NextApiRequest, NextApiResponse } from "next";
import db from "@lib/db";
import { getBase, generateToken, errorGenerator } from "@lib";
import { getToken } from "next-auth/jwt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    if (!token && !authHeader) return res.status(401).json(errorGenerator(401, "Unauthorized"));

    const user = await db.getUserByToken(authHeader || token?.token);
    if (!user || (id !== user.username && !user.isAdmin)) return res.status(401).json(errorGenerator(401, "Unauthorized."));

    const isLink = Boolean(req.query.link);
    const isSharenix = Boolean(req.query.sharenix);
    const urlBase = `${getBase(req)}/api`;
    let userToken = user.token;

    if (!userToken) {
        userToken = await generateToken();
        await db.setToken(user.username, userToken);
    }

    if (isSharenix) {
        const config = generateSharenixConfig(user, userToken, urlBase, urlBase);
        res.setHeader("Content-Disposition", `attachment; filename="${user.username} Sharenix Config.json"`);
        res.setHeader("Content-Type", "application/json");
        return res.send(config);
    }

    const config = generateSXCUConfig(user, userToken, isLink, urlBase);
    res.setHeader("Content-Disposition", `attachment; filename="${user.username} ${isLink ? "Link shorten" : "Upload"}.sxcu"`);
    res.setHeader("Content-Type", "application/sxcu");
    return res.send(config);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateSharenixConfig(user: any, token: string, hostname: string, urlBase: string) {
    // Generate Sharenix-specific config
    return {
        DefaultFileUploader: `${hostname} ${user.username} Upload`,
        DefaultImageUploader: `${hostname} ${user.username} Upload`,
        DefaultUrlShortener: `${hostname} ${user.username} URL service`,
        Services: [
            {
                Name: `${hostname} ${user.username} Upload`,
                RequestType: "POST",
                Headers: { Authorization: token },
                RequestURL: `${urlBase}/files`,
                FileFormName: "files",
                URL: "$json:url$",
                DeletionURL: "$json:deletionUrl$",
            },
            {
                Name: `${hostname} ${user.username} URL service`,
                RequestType: "POST",
                RequestURL: `${urlBase}/links`,
                Headers: {
                    Authorization: token,
                    "shorten-url": "$input$"
                },
                URL: "$json:url$"
            }
        ],
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateSXCUConfig(user: any, token: string, isLink: boolean, urlBase: string) {
    return isLink
        ? {
            Name: `${urlBase} ${user.username} URL service`,
            DestinationType: "URLShortener, URLSharingService",
            RequestMethod: "POST",
            RequestURL: `${urlBase}/links`,
            Headers: { Authorization: token, "shorten-url": "$input$" },
            URL: "$json:url$",
        }
        : {
            Name: `${urlBase} ${user.username} Upload`,
            DestinationType: "ImageUploader, TextUploader, FileUploader",
            RequestMethod: "POST",
            RequestURL: `${urlBase}/files`,
            Headers: { Authorization: token },
            Body: "MultipartFormData",
            FileFormName: "files",
            URL: "$json:url$",
            ThumbnailURL: "$json:url$",
            DeletionURL: "$json:deletionUrl$",
        };
}

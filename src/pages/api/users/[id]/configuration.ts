import { NextApiRequest, NextApiResponse } from "next";
import { getDatabase } from '@lib/db';
import { getBase, generateToken, errorGenerator } from "@lib";
import { getToken } from "next-auth/jwt";
import { User } from "@lib/models/user";
import { hash } from "bcrypt"; // For password hashing
import { hashRounds } from "@lib"; // Your hashRounds constant
import { shorteners } from "@lib/generators";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query; // This 'id' is the username of the target user for config changes
    const db = await getDatabase();

    const jwtToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    const requestorTokenString = authHeader ? authHeader : jwtToken?.token;

    if (!requestorTokenString) {
        return res.status(401).json(errorGenerator(401, "Unauthorized: Token missing."));
    }

    const requestorUser = await db.getUserByToken(requestorTokenString);

    if (!requestorUser) {
        return res.status(401).json(errorGenerator(401, "Unauthorized: Invalid requestor token."));
    }

    // User whose configuration is being targeted
    const targetUser = await db.getUser(id as string);
    if (!targetUser) {
        return res.status(404).json(errorGenerator(404, "Target user not found."));
    }

    // Authorization: Requestor must be admin OR must be the target user
    if (requestorUser.username !== targetUser.username && !requestorUser.isAdmin) {
        return res.status(403).json(errorGenerator(403, "Forbidden: You cannot modify this user's configuration."));
    }

    if (req.method === 'GET') {
        // This GET might also be a place to return user settings like 'shortener' if needed
        // For example:
        // if (req.query.getSettings === 'true') {
        //    return res.json({ success: true, user: { username: targetUser.username, shortener: targetUser.shortener, token: targetUser.token } });
        // }
        // ... (rest of your GET logic) ...
        const isLink = Boolean(req.query.link);
        const urlBase = `${getBase(req)}/api`;
        let userTokenForConfig = targetUser.token; // Use target user's token for config

        if (!userTokenForConfig) {
            userTokenForConfig = await generateToken();
            await db.setToken(targetUser.username, userTokenForConfig); // Save new token for target user
        }

        const config = generateSXCUConfig(targetUser, userTokenForConfig, isLink, urlBase);
        res.setHeader("Content-Disposition", `attachment; filename="${targetUser.username} ${isLink ? "Link shorten" : "Upload"}.sxcu"`);
        res.setHeader("Content-Type", "application/sxcu");
        return res.send(config);
    } else if (req.method === 'POST') {
        // Handle updates to user configuration
        const { password, resetToken, shortener } = req.body;

        try {
            if (password) {
                if (typeof password !== 'string' || password.length < 3) { // Add your password validation
                    return res.status(400).json(errorGenerator(400, "Invalid new password."));
                }
                const hashedPassword = await hash(password, hashRounds);
                await db.setPassword(targetUser.username, hashedPassword); // db.updateUserPassword(username, newHashedPassword)
                return res.json({ success: true, message: "Password updated successfully." });
            }

            if (resetToken === true) {
                const newToken = await generateToken();
                await db.setToken(targetUser.username, newToken); // db.setToken(username, newToken)
                return res.json({ success: true, message: "API token reset successfully.", newToken });
            }

            if (shortener) {
                if (!shorteners.includes(shortener)) {
                    return res.status(400).json(errorGenerator(400, "Invalid shortener type."));
                }
                await db.setShortener(targetUser.username, shortener); // db.updateUserShortener(username, newShortener)
                return res.json({ success: true, message: "ID generator updated successfully." });
            }

            return res.status(400).json(errorGenerator(400, "No update action specified."));

        } catch (error: any) {
            console.error(`Error updating config for ${targetUser.username}:`, error);
            return res.status(500).json(errorGenerator(500, error.message || "Failed to update configuration."));
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json(errorGenerator(405, `Method ${req.method} Not Allowed`));
    }
}

function generateSXCUConfig(user: User, token: string, isLink: boolean, urlBase: string) {
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

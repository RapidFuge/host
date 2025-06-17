import { NextApiRequest, NextApiResponse } from "next";
import { getDatabase } from '@lib/db'; // Assuming User type is from db
import { getBase, generateToken, errorGenerator, hashRounds } from "@lib"; // Ensure shorteners array and ShortenerType are from @lib
import { getToken } from "next-auth/jwt";
import { hash } from "bcrypt";
import { User } from "@lib/models/user";
import { shorteners } from "@lib/generators";

// Assuming User interface includes:
// username: string;
// token: string; // API key
// password?: string;
// shortener: ShortenerType;
// isAdmin: boolean;
// embedImageDirectly?: boolean;
// customEmbedDescription?: string | null;

const expirationOptions = [
    "never",
    "1h",
    "6h",
    "1d",
    "1w",
    "1M",
    "3M",
    "1y",
];

function generateSXCUConfig(user: User, token: string, isLink: boolean, urlBase: string, host?: string) {
    const apiBase = `${urlBase}/api`; // Assuming your API routes are under /api
    return isLink
        ? {
            Name: `${user.username} URL Shortener (${host ?? urlBase})`,
            DestinationType: "URLShortener, URLSharingService",
            RequestMethod: "POST",
            RequestURL: `${apiBase}/links`, // Use /api/links for consistency
            Headers: { Authorization: token },
            Body: "JSON", // Send URL in JSON body
            Data: `{"url":"$input$"}`,
            URL: "$json:url$",
        }
        : {
            Name: `${user.username} File Upload (${host ?? urlBase})`,
            DestinationType: "ImageUploader, TextUploader, FileUploader",
            RequestMethod: "POST",
            RequestURL: `${apiBase}/files`,
            Headers: { Authorization: token },
            Body: "MultipartFormData",
            FileFormName: "files",
            URL: "$json:url$",
            DeletionURL: "$json:deleteUrl$", // Use deleteUrl if your API returns it
        };
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id: targetUsername } = req.query;
    const db = await getDatabase();

    const jwtToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const authHeader = req.headers.authorization;
    const requestorTokenString = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader) : jwtToken?.token;

    if (!requestorTokenString) {
        return res.status(401).json(errorGenerator(401, "Unauthorized: Token missing."));
    }
    const requestorUser = await db.getUserByToken(requestorTokenString);
    if (!requestorUser) {
        return res.status(401).json(errorGenerator(401, "Unauthorized: Invalid requestor token."));
    }

    const targetUserFromDB = await db.getUser(targetUsername as string);
    if (!targetUserFromDB) {
        return res.status(404).json(errorGenerator(404, "Target user not found."));
    }

    if (requestorUser.username !== targetUserFromDB.username && !requestorUser.isAdmin) {
        return res.status(403).json(errorGenerator(403, "Forbidden: Cannot modify this configuration."));
    }

    if (req.method === 'GET') {
        const isLink = req.query.link === "true";
        const urlBase = getBase(req); // Get http(s)://host
        let userTokenForConfig = targetUserFromDB.token;

        if (!userTokenForConfig) {
            userTokenForConfig = await generateToken();
            await db.setToken(targetUserFromDB.username, userTokenForConfig);
        }

        const config = generateSXCUConfig(targetUserFromDB, userTokenForConfig, isLink, urlBase, req?.headers.host);
        res.setHeader("Content-Disposition", `attachment; filename="${targetUserFromDB.username} ${isLink ? "URL" : "File"} Config.sxcu"`);
        res.setHeader("Content-Type", "application/json"); // SXCU are JSON files with a specific extension
        return res.json(config); // Send as JSON

    } else if (req.method === 'POST') {
        const { password, resetToken, shortener, embedImageDirectly, customEmbedDescription, defaultFileExpiration } = req.body;
        let updateApplied = false;
        const messages: string[] = [];
        const embedPreferencesToUpdate: { embedImageDirectly?: boolean; customEmbedDescription?: string | null } = {};

        try {
            if (typeof password === 'string') {
                if (password.length < 3) return res.status(400).json(errorGenerator(400, "New password too short."));
                const hashedPassword = await hash(password, hashRounds);
                await db.setPassword(targetUserFromDB.username, hashedPassword);
                updateApplied = true; messages.push("Password updated.");
            }

            if (resetToken === true) {
                const newToken = await generateToken();
                await db.setToken(targetUserFromDB.username, newToken);
                updateApplied = true; messages.push("API token reset.");
                // Optionally return newToken if the client needs it immediately for self-resets,
                // but be cautious. For admin resets, no need to return it in response.
                // if (requestorUser.username === targetUserFromDB.username) {
                //     return res.json({ success: true, message: "API token reset successfully.", newToken });
                // }
            }

            if (typeof shortener === 'string') {
                if (!shorteners.includes(shortener)) return res.status(400).json(errorGenerator(400, "Invalid shortener type."));
                await db.setShortener(targetUserFromDB.username, shortener as shorteners);
                updateApplied = true; messages.push("ID generator updated.");
            }

            if (typeof defaultFileExpiration === 'string') {
                if (!expirationOptions.includes(defaultFileExpiration)) return res.status(400).json(errorGenerator(400, "Invalid expiration option."));
                await db.setDefaultExpiration(targetUserFromDB.username, defaultFileExpiration);
                updateApplied = true; messages.push("Default Expiration date updated.");
            }

            let embedPrefsChanged = false;
            if (typeof embedImageDirectly === 'boolean') {
                embedPreferencesToUpdate.embedImageDirectly = embedImageDirectly;
                embedPrefsChanged = true;
            }

            if (customEmbedDescription !== undefined) {
                const descriptionToSet = (typeof customEmbedDescription === 'string' && customEmbedDescription.trim() === "") ? null : customEmbedDescription;
                if (descriptionToSet !== null && (typeof descriptionToSet !== 'string' || descriptionToSet.length > 250)) {
                    return res.status(400).json(errorGenerator(400, "Custom description is too long or invalid."));
                }
                embedPreferencesToUpdate.customEmbedDescription = descriptionToSet;
                embedPrefsChanged = true;
            }

            if (embedPrefsChanged && Object.keys(embedPreferencesToUpdate).length > 0) {
                await db.setEmbedPreferences(targetUserFromDB.username, embedPreferencesToUpdate);
                updateApplied = true;
                if (embedPreferencesToUpdate.embedImageDirectly !== undefined) messages.push("Embed preference updated.");
                if (embedPreferencesToUpdate.customEmbedDescription !== undefined) messages.push("Custom embed description updated.");
            }

            if (updateApplied) {
                return res.json({ success: true, message: messages.join(" ") || "Configuration updated." });
            } else {
                return res.status(400).json(errorGenerator(400, "No valid update action specified or no changes detected."));
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error(`Error updating config for ${targetUserFromDB.username}:`, error);
            return res.status(500).json(errorGenerator(500, error.message || "Failed to update configuration."));
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json(errorGenerator(405, `Method ${req.method} Not Allowed`));
    }
}
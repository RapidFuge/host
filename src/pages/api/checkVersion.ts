import { NextApiRequest, NextApiResponse } from "next";

const GITHUB_OWNER = 'rapidfuge';
const GITHUB_REPO = 'host';
const GITHUB_BRANCH = 'main';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    try {
        // Get local version from environment variable
        const localVersion = process.env.APP_VERSION;

        if (!localVersion) {
            return res.status(400).json({
                error: 'No APP_VERSION found in environment variables',
                match: false
            });
        }

        // Fetch remote package.json from GitHub
        const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/package.json`;

        const response = await fetch(githubUrl);

        if (!response.ok) {
            if (response.status === 404) {
                return res.status(404).json({
                    error: 'Repository or package.json not found on GitHub',
                    match: false
                });
            }
            throw new Error(`GitHub API responded with status: ${response.status}`);
        }

        const remotePackageJson = await response.json();
        const remoteVersion = remotePackageJson.version;

        if (!remoteVersion) {
            return res.status(400).json({
                error: 'No version found in remote package.json',
                match: false
            });
        }

        // Compare versions
        const match = localVersion === remoteVersion;

        return res.status(200).json({
            match,
            localVersion,
            remoteVersion,
            repository: `${GITHUB_OWNER}/${GITHUB_REPO}`,
            branch: GITHUB_BRANCH
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Version check error:', error);
        return res.status(500).json({
            error: 'Failed to check version',
            message: error.message,
            match: false
        });
    }
}
import { randomBytes } from 'crypto';
import { IncomingMessage } from 'http';
import { NextApiRequest } from 'next';
import { isEmpty, isAlphanumeric, isLength, isWhitelisted } from 'validator';

export const adminUser = "root";
export const hashRounds = 12;

const fileWhitelist = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.0123456789";

export function generateToken(): Promise<string> {
	return new Promise(function (resolve, reject) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		randomBytes(80, function (err: any, buffer: Buffer) {
			if (err) {
				reject(err);
			}
			const token = buffer.toString("base64");
			resolve(token.substring(0, 50));
		});
	});
}

export const validTag = (tag: string) => typeof tag === "string" && !isEmpty(tag) && isAlphanumeric(tag);
export const validFile = (tag: string) => typeof tag === "string" && !isEmpty(tag) && isWhitelisted(tag, fileWhitelist) && isLength(tag, {
	min: 6,
	max: 100
});

export const getBase = (req: NextApiRequest | Partial<IncomingMessage>) => {
	if (!req) return "";
	if (!req.headers) return "";
	const protocol = req?.headers["x-forwarded-proto"] || "http";
	const host = req?.headers.host;

	return `${protocol}://${host}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorGenerator(status: string | number, message: string, additional?: any) {
	return {
		error: {
			status,
			message,
			...additional
		}
	};
}

export function formatTimeRemaining(dateString: string): string {
	const future = new Date(dateString).getTime();
	const now = new Date().getTime();
	const diff = future - now;

	if (diff <= 0) return "Expired";

	const s = Math.floor(diff / 1000);
	const m = Math.floor(s / 60);
	const h = Math.floor(m / 60);
	const d = Math.floor(h / 24);

	if (d > 0) return `in ${d} day${d > 1 ? 's' : ''}`;
	if (h > 0) return `in ${h} hour${h > 1 ? 's' : ''}`;
	if (m > 0) return `in ${m} minute${m > 1 ? 's' : ''}`;

	return 'in less than a minute';
}
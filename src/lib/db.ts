import { adminUser, generateToken, hashRounds } from './index';
import { hash } from 'bcrypt';
import mongoose from 'mongoose';
import userBase from './models/user';
import linkBase from './models/url';
import fileBase from './models/file';
import upTokens from './models/upTokens';
import { shorteners } from './generators';
import MinIOClient, { FileStat } from './minio';

const PAGE_SIZE = 20;
let databaseInstance: Database | null = null;

class Database {
	public userBase = userBase;
	public linkBase = linkBase;
	public fileBase = fileBase;
	public upTokens = upTokens;
	public imageDrive: MinIOClient;
	private initialized = false;

	constructor() {
		if (!process.env.MONGO_URI) throw new Error("Missing MONGO_URI environment variable.");
		if (!process.env.MINIO_ENDPOINT) throw new Error("Missing MINIO_ENDPOINT environment variable.");
		if (!process.env.MINIO_BUCKET) throw new Error("Missing MINIO_BUCKET environment variable.");
		if (!process.env.MINIO_USERNAME) throw new Error("Missing MINIO_USERNAME environment variable.");
		if (!process.env.MINIO_PASSWORD) throw new Error("Missing MINIO_PASSWORD environment variable.");

		this.imageDrive = new MinIOClient(
			process.env.MINIO_ENDPOINT!,
			process.env.MINIO_BUCKET!,
			'uploads',
			process.env.MINIO_USERNAME!,
			process.env.MINIO_PASSWORD!
		)
	}

	public async initialize() {
		try {
			if (this.initialized) return console.log("Already initialized!");

			await this.imageDrive.login();
			console.log("Connected to S3")

			await mongoose.connect(process.env.MONGO_URI!);
			console.log("Connected to MongoDB");

			const root = await this.userBase.findOne({ username: adminUser });
			if (!root) {
				console.log("No root user exists. Creating one with default password.");
				const token = await generateToken();
				await this.userBase.create({
					username: adminUser,
					password: await hash(process.env.ROOT_PASSWORD!, hashRounds), // Adjust hashRounds as needed
					isAdmin: true,
					token,
				});
			} else {
				console.log("Root user exists.");
			}

			// Start periodic tasks
			setInterval(() => this.checkFiles(), 1800000); // Check files every 30 minutes
			setInterval(() => this.checkForExpiredTokens(), 600000); // Check expired tokens every 10 minutes
			this.checkFiles();
			this.checkForExpiredTokens();
			this.initialized = true;
		} catch (err) {
			console.error("Initialization failed:", err);
			process.exit(1);
		}
	}

	// DB Clean-up: Checks that all files on the drive.
	// If a file doesn't exist, it is removed from the database.
	private async checkFiles() {
		const files = await this.getFiles();
		// const dbList: Array<FileStat> = await this.imageDrive.list();
		const dbList: Array<FileStat> = await this.imageDrive.list();

		if (files) {
			for (const file of files) {
				if (!dbList.find((f) => f.basename === file.fileName || f.basename === file.videoThumbnail)) {
					if (process.env.ISPRODUCTION === "true") await this.removeFile(file.id);
					console.log(`DATABASE-CLEANUP --> Removed DB Entry ${file.id}.${file.extension} from file database.`);
				}
			}

			for (const file of dbList) {
				let exists;

				if (file.basename.includes(".thumbnail.jpeg")) {
					exists = await this.getFileByVideoThumbnail(file.basename);
					if (!exists) {
						console.log(`FILE-CLEANUP --> Removed file ${file.basename} from MinIO.`);
						if (process.env.ISPRODUCTION === "true") await this.imageDrive.remove(file.basename);
						continue; // Skip to the next file, no need to check further
					}
				}

				if (!exists) {
					exists = await this.getFileByName(file.basename);
					if (!exists) {
						console.log(`FILE-CLEANUP --> Removed file ${file.basename} from MinIO.`);
						if (process.env.ISPRODUCTION === "true") await this.imageDrive.remove(file.basename);
					}
				}
			}
		}
	}

	private async checkForExpiredTokens() {
		const tokens = await this.getSignUpTokens();

		for (const token of tokens) {
			if (Date.now() >= token.expires.getTime()) {
				await this.upTokens.deleteOne({ token: token.token });
				console.log(`TOKEN-CLEANUP --> Deleted expired token: ${token.token}. Expired at ${(new Date(token.expires)).toLocaleString()}`)
			}
		}
	}

	// Gets
	public async getFile(id: string) {
		return this.fileBase.findOne({ id });
	}
	public async getFileByName(fileName: string) {
		return this.fileBase.findOne({ fileName });
	}
	public async getFileByVideoThumbnail(videoThumbnail: string) {
		return this.fileBase.findOne({ videoThumbnail });
	}
	public async getLink(id: string) {
		return this.linkBase.findOne({ id });
	}
	public async getSignUpToken(token: string) {
		return this.upTokens.findOne({ token });
	}
	public async getFiles() {
		const query = await this.fileBase.find();
		return query.map(i => i.toJSON());
	}
	public async getLinks(username: string) {
		const query = await this.linkBase.find();
		const json = query.map(i => i.toJSON());
		return json.filter((file) => file.owner === username);
	}
	public async getUsers() {
		const query = await this.userBase.find();
		return query.map(i => i.toJSON());
	}
	public async getSignUpTokens() {
		const query = await this.upTokens.find();
		return query.map(i => i.toJSON());
	}
	public async getUser(username: string) {
		return this.userBase.findOne({ username }).catch(() => undefined);
	}

	public async getUserFiles(username: string, page = 0) {
		const offset = page * PAGE_SIZE;
		const allUserFiles = await this.getAllUserFiles(username);

		const totalCount = allUserFiles.length;
		const totalPages = Math.ceil(totalCount / PAGE_SIZE);

		const filesForCurrentPage = allUserFiles.slice(offset, offset + PAGE_SIZE);

		return {
			files: filesForCurrentPage,
			totalPages,
		};
	}

	public async getAllUserFiles(username: string) {
		const files = await this.getFiles();
		return files.filter(f => f.owner === username).sort((a, b) => b.created.getTime() - a.created.getTime());
	}

	public async getUserByToken(token: string | undefined) {
		// Just to double check, ensure token is defined.
		if (!token || typeof token !== "string") {
			throw new Error("Illegal authorisation token!");
		}

		return this.userBase.findOne({ token }).catch(() => undefined);
	}

	// Adds file
	public async addFile(fileName: string, id: string, extension: string | undefined, userId: string, size: number, isPrivate = false) {
		return this.fileBase.create({ fileName, id, extension, owner: userId, created: Date.now(), size, isPrivate });
	}

	public async addUser(username: string, passwordHash: string, token: string) {
		return this.userBase.create({ username, password: passwordHash, token, shortener: "random" });
	}

	// Link shortener
	public async addLink(id: string, url: string, owner: string) {
		return this.linkBase.create({ id, url, owner, created: Date.now() });
	}

	public async addSignUpToken(token: string, expires: number) {
		return this.upTokens.create({ token, expires: Date.now() + expires, created: Date.now() })
	}

	// Removes
	public async removeFile(id: string) {
		const file = await this.getFile(id);
		if (!file) return true;
		return this.fileBase.deleteOne({ id });
	}

	async removeLink(id: string) {
		const link = await this.getLink(id);
		if (!link) return true;
		return this.linkBase.deleteOne({ id });
	}

	public async removeUser(username: string) {
		const user = await this.getUser(username);
		if (user) await this.userBase.deleteOne({ username });

		const res = await this.getUserFiles(username);
		for (const file of res.files) {
			await this.fileBase.deleteOne({ id: file.id });
		}
	}

	public async removeSignUpToken(token: string) {
		const Token = await this.upTokens.findOne({ token }).catch(() => undefined);
		if (!Token) return true;
		return this.upTokens.deleteOne({ token });
	}

	public async setPassword(username: string, password: string) {
		return this.userBase.updateOne({ username }, { $set: { password } });
	}

	public async setFilesOwner(oldOwner: string, newOwner: string) {
		return this.fileBase.updateMany({ owner: oldOwner }, { $set: { owner: newOwner } });
	}

	public async setToken(username: string, token: string | undefined) {
		return this.userBase.updateOne({ username }, { $set: { token } });
	}

	public async setShortener(username: string, shortener: shorteners) {
		return this.userBase.updateOne({ username }, { $set: { shortener } });
	}

	public async setEmbedPreferences(username: string, opt: { embedImageDirectly?: boolean, customEmbedDescription?: string | null }) {
		return this.userBase.updateOne({ username }, { $set: opt });
	}

	public async expireToken(username: string) {
		return this.setToken(username, undefined);
	}

}


export async function getDatabase(): Promise<Database> {
	if (databaseInstance && mongoose.connection.readyState === 1) return databaseInstance;

	if (!databaseInstance) databaseInstance = new Database();

	if (mongoose.connection.readyState !== 1) await databaseInstance.initialize();

	return databaseInstance;
}

// export default new Database();

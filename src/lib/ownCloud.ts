import { createClient } from "@asun01/webdav";

export default class OwnCloud {
    public rootFolder;
    public client;
    public username;
    constructor(url: string, rootFolder: string, username: string, password: string) {
        this.username = username;
        this.rootFolder = `/${rootFolder}/`;
        this.client = createClient(url, {
            username, password
        });
    }

    async login() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rootDirExists: any = await this.client.exists(this.rootFolder);
        console.log(`Logged in successfully to OwnCloud as user: ${this.username}`);
        if (!rootDirExists) {
            console.log(`${this.rootFolder} folder does not exist in owncloud server. Making directory..`);
            await this.client.createDirectory(this.rootFolder).catch(() => true);
            console.log(`${this.rootFolder} Folder successfully created.`)
        } else console.log("Root folder exists!")

        return true;
    }

    async list() {
        // Again, weird annoying type errors with this. Returns an array but using array properties give type errors.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this.client.getDirectoryContents(this.rootFolder) as any);
    }

    async put(fileName: string, buff: Buffer) {
        return this.client.putFileContents(this.rootFolder + fileName, buff);
    }

    async get(fileName: string) {
        return this.client.getFileContents(this.rootFolder + fileName).catch(() => false);
    }

    async remove(fileName: string) {
        return this.client.deleteFile(this.rootFolder + fileName).catch(() => true);
    }
}
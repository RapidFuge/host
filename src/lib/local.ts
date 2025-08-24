import path from "path";
import fs from "fs-extra";
import { FileStat } from "@lib";

export default class LocalStorageClient {
    private rootPath: string;

    constructor(rootPath: string = './uploads') {
        this.rootPath = path.resolve(rootPath);
    }

    async login(): Promise<boolean> {
        try {
            await fs.mkdir(this.rootPath, { recursive: true });
            console.log(`Using local storage at: ${this.rootPath}`);
            return true;
        } catch (err) {
            console.error('Failed to create local storage directory:', err);
            return false;
        }
    }

    async list(): Promise<FileStat[]> {
        const files = await fs.readdir(this.rootPath);
        const result: FileStat[] = [];
        for (const file of files) {
            try {
                const filePath = path.join(this.rootPath, file);
                const stat = await fs.stat(filePath);
                if (stat.isFile()) {
                    result.push({
                        filename: file,
                        basename: file,
                        lastmod: stat.mtime,
                        size: stat.size,
                        type: 'file',
                    });
                }
            } catch {
                // File might have been deleted between readdir and stat calls
            }
        }
        return result;
    }

    async put(fileName: string, data: string | Buffer): Promise<void> {
        const destinationPath = path.join(this.rootPath, fileName);
        if (typeof data === 'string') {
            await fs.copyFile(data, destinationPath);
        } else {
            await fs.writeFile(destinationPath, data);
        }
    }

    async get(fileName: string, options?: { start?: number; end?: number }) {
        const filePath = path.join(this.rootPath, fileName);
        try {
            await fs.access(filePath);

            if (options?.start !== undefined && options?.end !== undefined) {
                return fs.createReadStream(filePath, { start: options.start, end: options.end });
            }

            return fs.createReadStream(filePath);
        } catch {
            throw new Error(`File not found in local storage: ${fileName}`);
        }
    }


    async remove(fileName: string): Promise<boolean> {
        try {
            const filePath = path.join(this.rootPath, fileName);
            await fs.unlink(filePath);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            if (err.code !== 'ENOENT') {
                console.error('Failed to remove local file:', err);
            }
        }
        return true;
    }
}

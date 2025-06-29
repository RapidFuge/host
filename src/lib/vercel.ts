import { FileStat } from '@lib';
import { put, del, list, head } from '@vercel/blob';

export default class VercelBlobClient {
    public bucketName: string;
    public rootFolder: string;
    public username: string;

    constructor(accessKey: string, bucketName: string = "host", rootFolder: string = "uploads") {
        this.username = accessKey;
        this.bucketName = bucketName;
        this.rootFolder = rootFolder.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    }

    async login() {
        try {
            console.log(`Using Vercel Blob storage`);
            console.log(`Root folder: ${this.rootFolder}`);
            console.log(`Username: ${this.username}`);

            return true;
        } catch (error) {
            console.error('Vercel Blob initialization failed:', error);
            throw error;
        }
    }

    async list(): Promise<Array<FileStat>> {
        try {
            const prefix = this.rootFolder ? `${this.rootFolder}/` : '';

            // List blobs with the prefix
            const { blobs } = await list({
                prefix: prefix,
                limit: 1000 // Adjust as needed
            });

            return blobs.map(blob => ({
                filename: blob.pathname,
                basename: blob.pathname.split('/').pop() || blob.pathname,
                lastmod: new Date(blob.uploadedAt),
                size: blob.size,
                type: 'file' as const,
                etag: blob.pathname
            }));
        } catch (error) {
            console.error('Failed to list objects:', error);
            throw error;
        }
    }

    async put(fileName: string, buff: Buffer) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;

            const blob = await put(objectName, buff, {
                access: 'public',
                addRandomSuffix: false
            });

            return {
                etag: blob.url,
                url: blob.url
            };
        } catch (error) {
            console.error('Failed to put object:', error);
            throw error;
        }
    }

    async get(fileName: string) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;

            const blobInfo = await head(objectName);
            const response = await fetch(blobInfo.url);

            if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return response.body as any;
        } catch (error) {
            console.error(`Failed to get object stream for: ${fileName}`, error);
            throw error;
        }
    }

    async remove(fileName: string) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;

            const blobInfo = await head(objectName);
            await del(blobInfo.url);

            return true;
        } catch (error) {
            console.error('Failed to remove object:', error);
            return true;
        }
    }

    async exists(fileName: string): Promise<boolean> {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;
            await head(objectName);
            return true;
        } catch (_) {
            return false;
        }
    }

    async getMetadata(fileName: string) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;
            const blobInfo = await head(objectName);

            return {
                size: blobInfo.size,
                lastModified: new Date(blobInfo.uploadedAt),
                contentType: blobInfo.contentType,
                url: blobInfo.url,
                etag: blobInfo.pathname
            };
        } catch (error) {
            console.error('Failed to get metadata:', error);
            return null;
        }
    }

    async getUrl(fileName: string): Promise<string | null> {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;
            const blobInfo = await head(objectName);
            return blobInfo.url;
        } catch (error) {
            console.error('Failed to get URL:', error);
            return null;
        }
    }
}
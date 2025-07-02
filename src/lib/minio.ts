import { FileStat } from '@lib';
import * as Minio from 'minio';

export default class MinIOClient {
    public bucketName: string;
    public client: Minio.Client;
    public rootFolder: string;
    public username: string;

    constructor(
        endPoint: string,
        bucketName: string,
        rootFolder: string,
        accessKey: string,
        secretKey: string,
        useSSL: boolean = false,
        port: number = 9010
    ) {
        this.username = accessKey;
        this.bucketName = bucketName;
        this.rootFolder = rootFolder.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes

        // Parse endpoint if it includes protocol
        const cleanEndPoint = endPoint.replace(/^https?:\/\//, '');
        const [hostname, portStr] = cleanEndPoint.split(':');
        const parsedPort = portStr ? parseInt(portStr) : port;

        this.client = new Minio.Client({
            endPoint: hostname,
            port: parsedPort,
            useSSL,
            accessKey,
            secretKey,
        });
    }

    async login() {
        try {
            //   console.log(`Attempting to connect to MinIO at: ${this.client.host}:${this.client.port}`);
            console.log(`Bucket: ${this.bucketName}`);
            console.log(`Access Key: ${this.username}`);
            //   console.log(`SSL: ${this.client.useSSL}`);

            // Check if bucket exists, create if it doesn't
            try {
                const bucketExists = await this.client.bucketExists(this.bucketName);
                if (!bucketExists) {
                    console.log(`${this.bucketName} bucket does not exist in MinIO server. Creating bucket...`);
                    await this.client.makeBucket(this.bucketName);
                    console.log(`${this.bucketName} bucket successfully created.`);
                } else {
                    console.log("Bucket exists!");
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (err.code === 'BucketAlreadyOwnedByYou') {
                    console.warn(`Bucket '${this.bucketName}' already exists and is owned by you. Continuing.`);
                } else {
                    console.error("MinIO connection failed:", err);
                    throw err;
                }
            }

            return true;
        } catch (error) {
            console.error('MinIO connection failed:', error);
            throw error;
        }
    }

    async list(): Promise<Array<FileStat>> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const objects: any[] = [];
            const prefix = this.rootFolder ? `${this.rootFolder}/` : '';

            const stream = this.client.listObjects(this.bucketName, prefix, false);

            return new Promise((resolve, reject) => {
                stream.on('data', (obj) => {
                    objects.push({
                        filename: obj.name,
                        basename: obj.name?.split('/').pop(),
                        lastmod: obj.lastModified,
                        size: obj.size,
                        type: 'file',
                        etag: obj.etag
                    });
                });

                stream.on('error', reject);
                stream.on('end', () => resolve(objects as Array<FileStat>));
            });
        } catch (error) {
            console.error('Failed to list objects:', error);
            throw error;
        }
    }

    async put(fileName: string, data: string | Buffer) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;

            if (typeof data === 'string') {
                return await this.client.fPutObject(this.bucketName, objectName, data);
            } else {
                return await this.client.putObject(this.bucketName, objectName, data, data.length);
            }
        } catch (error) {
            console.error('Failed to put object:', error);
            throw error;
        }
    }

    async get(fileName: string) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;
            return await this.client.getObject(this.bucketName, objectName);
        } catch (error) {
            console.error(`Failed to get object stream for: ${fileName}`, error);
            throw error; // Re-throw the error for the caller to handle
        }
    }

    async remove(fileName: string) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;
            await this.client.removeObject(this.bucketName, objectName);
            return true;
        } catch (error) {
            console.error('Failed to remove object:', error);
            return true; // Return true to match original behavior
        }
    }

    // Additional utility methods specific to MinIO
    async exists(fileName: string): Promise<boolean> {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;
            await this.client.statObject(this.bucketName, objectName);
            return true;
        } catch (_) {
            return false;
        }
    }

    async getMetadata(fileName: string) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;
            return await this.client.statObject(this.bucketName, objectName);
        } catch (error) {
            console.error('Failed to get metadata:', error);
            return null;
        }
    }
}
import { FileStat } from '@lib';
import { S3Client, ListObjectsV2Command, HeadBucketCommand, CreateBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { createReadStream } from 'fs';

export default class AWSS3Client {
    public bucketName: string;
    public client: S3Client;
    public rootFolder: string;
    public username: string;

    constructor(
        endPoint: string,
        bucketName: string,
        rootFolder: string,
        accessKey: string,
        secretKey: string,
        useSSL: boolean = true,
        port?: number
    ) {
        this.username = accessKey;
        this.bucketName = bucketName;
        this.rootFolder = rootFolder.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes

        // Parse endpoint if it includes protocol
        const protocol = useSSL ? 'https' : 'http';
        const cleanEndPoint = endPoint.replace(/^https?:\/\//, '');
        const [hostname, portStr] = cleanEndPoint.split(':');
        const finalPort = portStr ? parseInt(portStr) : port;

        // Construct the endpoint URL
        const endpointUrl = finalPort
            ? `${protocol}://${hostname}:${finalPort}`
            : `${protocol}://${hostname}`;

        this.client = new S3Client({
            region: 'auto', // Auto region detection
            endpoint: endpointUrl,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            },
            forcePathStyle: true, // Important for MinIO compatibility
        });
    }

    async login() {
        try {
            console.log(`Bucket: ${this.bucketName}`);
            console.log(`Access Key: ${this.username}`);

            // Check if bucket exists, create if it doesn't
            try {
                await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
                console.log("Bucket exists!");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (err: any) {
                if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
                    console.log(`${this.bucketName} bucket does not exist in S3. Creating bucket...`);
                    await this.client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
                    console.log(`${this.bucketName} bucket successfully created.`);
                } else {
                    console.error("S3 connection failed:", err);
                    throw err;
                }
            }

            return true;
        } catch (error) {
            console.error('S3 connection failed:', error);
            throw error;
        }
    }

    async list(): Promise<Array<FileStat>> {
        try {
            const objects: FileStat[] = [];
            const prefix = this.rootFolder ? `${this.rootFolder}/` : '';

            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                Delimiter: '/', // Only get objects in current "folder"
            });

            const response = await this.client.send(command);

            if (response.Contents) {
                for (const obj of response.Contents) {
                    if (obj.Key) {
                        objects.push({
                            filename: obj.Key,
                            basename: obj.Key.split('/').pop() || '',
                            lastmod: obj.LastModified || new Date(),
                            size: obj.Size || 0,
                            type: 'file',
                            etag: obj.ETag || ''
                        });
                    }
                }
            }

            return objects;
        } catch (error) {
            console.error('Failed to list objects:', error);
            throw error;
        }
    }

    async put(fileName: string, data: string | Buffer) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;

            let body: Buffer | Readable;
            if (typeof data === 'string') {
                body = createReadStream(data);
            } else {
                body = data;
            }

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: objectName,
                Body: body,
            });

            return await this.client.send(command);
        } catch (error) {
            console.error('Failed to put object:', error);
            throw error;
        }
    }

    async get(fileName: string): Promise<Readable> {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;

            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: objectName,
            });

            const response = await this.client.send(command);

            if (response.Body instanceof Readable) {
                return response.Body;
            } else {
                // Handle other body types by converting to Readable
                const readable = new Readable();
                readable.push(response.Body);
                readable.push(null);
                return readable;
            }
        } catch (error) {
            console.error(`Failed to get object stream for: ${fileName}`, error);
            throw error;
        }
    }

    async remove(fileName: string) {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;

            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: objectName,
            });

            await this.client.send(command);
            return true;
        } catch (error) {
            console.error('Failed to remove object:', error);
            return true; // Return true to match original behavior
        }
    }

    // Additional utility methods specific to S3
    async exists(fileName: string): Promise<boolean> {
        try {
            const objectName = this.rootFolder ? `${this.rootFolder}/${fileName}` : fileName;

            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: objectName,
            });

            await this.client.send(command);
            return true;
        } catch (_) {
            return false;
        }
    }
}
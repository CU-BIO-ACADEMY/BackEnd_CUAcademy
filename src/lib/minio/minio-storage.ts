import type { Client } from "minio";

export class MinioStorage {
    constructor(
        private readonly minioClient: Client,
        private readonly publicUrl?: string
    ) {}

    async uploadFile(bucket: string, key: string, file: Buffer) {
        const exists = await this.minioClient.bucketExists(bucket);

        if (!exists) await this.minioClient.makeBucket(bucket);

        await this.minioClient.putObject(bucket, key, file);
    }

    async getFileURL(bucket: string, key: string) {
        const url = await this.minioClient.presignedGetObject(bucket, key, 24 * 60 * 60);

        if (this.publicUrl) {
            const parsed = new URL(url);
            return url.replace(parsed.origin, this.publicUrl);
        }

        return url;
    }
}

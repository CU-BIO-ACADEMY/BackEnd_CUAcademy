import type { FileRepository } from "./files.repository";
import { NotFoundError } from "../../lib/error";
import type { MinioStorage } from "../../lib/minio/minio-storage";
import { v4 } from "uuid";

export class FileService {
    constructor(
        private readonly fileRepository: FileRepository,
        private readonly minioStorage: MinioStorage
    ) {}

    async createFile({ key, file }: { key: string; file: Buffer }) {
        const bucket = "chula";

        const file_id = v4();

        await this.fileRepository.create({
            id: file_id,
            bucket: bucket,
            key: key,
        });

        await this.minioStorage.uploadFile(bucket, key, file);

        return file_id
    }

    async getFileById(id: string) {
        const file = await this.fileRepository.getFileById(id);

        if (!file) throw new NotFoundError("File not found");

        const url = await this.minioStorage.getFileURL(file.bucket, file.key);

        return { ...file, url: url };
    }
}

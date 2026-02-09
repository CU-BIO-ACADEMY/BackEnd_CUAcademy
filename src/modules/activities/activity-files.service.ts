import type { ActivityFilesRepository, CreateActivityFileType } from "./activity-files.repository";
import type { FileService } from "../files/files.service";
import type { FileType } from "../../lib/drizzle/schema";
import { v4 } from "uuid";

export type CreateActivityFileInput = {
    file: Buffer;
    filename: string;
    mimetype: string;
    size: number;
    display_name?: string;
};

export class ActivityFilesService {
    constructor(
        private readonly activityFilesRepository: ActivityFilesRepository,
        private readonly fileService: FileService
    ) {}

    async createActivityFile(
        activity_id: string,
        data: CreateActivityFileInput,
        file_type: FileType = "attachment"
    ) {
        const ext = data.filename.split(".").pop() || "";
        const key = `${v4()}.${ext}`;

        const file_id = await this.fileService.createFile({
            key,
            file: data.file,
            filename: data.filename,
            mimetype: data.mimetype,
            size: data.size,
        });

        await this.activityFilesRepository.create({
            activity_id,
            file_id,
            file_type,
            display_name: data.display_name || null,
        });

        return file_id;
    }

    async createManyActivityFiles(
        activity_id: string,
        files: CreateActivityFileInput[],
        file_type: FileType = "attachment"
    ) {
        const results = await Promise.all(
            files.map((file) => this.createActivityFile(activity_id, file, file_type))
        );
        return results;
    }

    async getActivityFiles(activity_id: string) {
        const activityFiles = await this.activityFilesRepository.getByActivityId(activity_id);

        const filesWithUrls = await Promise.all(
            activityFiles.map(async (activityFile) => {
                const file = await this.fileService.getFileById(activityFile.file_id);
                return {
                    ...activityFile,
                    file: {
                        id: file.id,
                        filename: file.filename,
                        mimetype: file.mimetype,
                        size: file.size,
                        url: file.url,
                    },
                };
            })
        );

        return filesWithUrls;
    }

    async getActivityFilesByType(activity_id: string, file_type: FileType) {
        const allFiles = await this.getActivityFiles(activity_id);
        return allFiles.filter((f) => f.file_type === file_type);
    }

    async deleteActivityFile(id: string) {
        await this.activityFilesRepository.deleteById(id);
    }
}

import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { filesTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

export type CreateFileType = {
    id: string;
    bucket: string;
    key: string;
    filename: string;
    mimetype: string;
    size: number;
};

type GetFileType = InferSelectModel<typeof filesTable>;

export interface FileRepository {
    create(data: CreateFileType): Promise<void>;
    getFileById(id: string): Promise<GetFileType | undefined>;
}

export class DrizzleFileRepository implements FileRepository {
    async create(data: CreateFileType): Promise<void> {
        await db.insert(filesTable).values(data);
    }

    async getFileById(id: string): Promise<GetFileType | undefined> {
        return db
            .select()
            .from(filesTable)
            .where(eq(filesTable.id, id))
            .limit(1)
            .then((rows) => rows[0]);
    }
}

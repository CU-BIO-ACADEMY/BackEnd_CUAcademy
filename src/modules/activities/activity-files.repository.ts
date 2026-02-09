import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { activityFilesTable, type fileTypeEnum } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type FileType = typeof fileTypeEnum.enumValues[number];

export type CreateActivityFileType = {
    id?: string;
    activity_id: string;
    file_id: string;
    file_type: FileType;
    display_name?: string | null;
};

export type GetActivityFileType = InferSelectModel<typeof activityFilesTable>;

export interface ActivityFilesRepository {
    create(data: CreateActivityFileType): Promise<void>;
    createMany(data: CreateActivityFileType[]): Promise<void>;
    getByActivityId(activity_id: string): Promise<GetActivityFileType[]>;
    getById(id: string): Promise<GetActivityFileType | undefined>;
    deleteById(id: string): Promise<void>;
}

export class DrizzleActivityFilesRepository implements ActivityFilesRepository {
    async create(data: CreateActivityFileType): Promise<void> {
        await db.insert(activityFilesTable).values(data);
    }

    async createMany(data: CreateActivityFileType[]): Promise<void> {
        if (data.length === 0) return;
        await db.insert(activityFilesTable).values(data);
    }

    async getByActivityId(activity_id: string): Promise<GetActivityFileType[]> {
        return db
            .select()
            .from(activityFilesTable)
            .where(eq(activityFilesTable.activity_id, activity_id));
    }

    async getById(id: string): Promise<GetActivityFileType | undefined> {
        return db
            .select()
            .from(activityFilesTable)
            .where(eq(activityFilesTable.id, id))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async deleteById(id: string): Promise<void> {
        await db.delete(activityFilesTable).where(eq(activityFilesTable.id, id));
    }
}

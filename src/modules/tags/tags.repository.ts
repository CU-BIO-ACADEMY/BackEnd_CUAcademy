import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { tagsTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateTagType = InferInsertModel<typeof tagsTable>;
type GetTagType = InferSelectModel<typeof tagsTable> | undefined;

export interface TagRepository {
    create(data: CreateTagType): Promise<void>;
    get(): Promise<GetTagType[]>;
    getTagById(id: string): Promise<GetTagType>;
    getTagByName(name: string): Promise<GetTagType>;
    delete(id: string): Promise<void>;
}

export class DrizzleTagRepository implements TagRepository {
    async create(data: CreateTagType): Promise<void> {
        await db.insert(tagsTable).values(data);
    }

    async get(): Promise<GetTagType[]> {
        return db.select().from(tagsTable);
    }

    async getTagById(id: string): Promise<GetTagType> {
        return db
            .select()
            .from(tagsTable)
            .where(eq(tagsTable.id, id))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async getTagByName(name: string): Promise<GetTagType> {
        return db
            .select()
            .from(tagsTable)
            .where(eq(tagsTable.name, name))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async delete(id: string): Promise<void> {
        await db.update(tagsTable).set({ deleted_at: new Date() }).where(eq(tagsTable.id, id));
    }
}

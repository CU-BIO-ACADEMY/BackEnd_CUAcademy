import { eq, and, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { activityTagsTable, tagsTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateActivityTagType = InferInsertModel<typeof activityTagsTable>;
type GetActivityTagType = InferSelectModel<typeof activityTagsTable> | undefined;

export interface ActivityTagsRepository {
    add(activityId: string, tagId: string): Promise<void>;
    remove(activityId: string, tagId: string): Promise<void>;
    getActivityTags(activityId: string): Promise<GetActivityTagType[]>;
    getActivityTagDetails(activityId: string): Promise<Array<InferSelectModel<typeof tagsTable>>>;
    hasTag(activityId: string, tagId: string): Promise<boolean>;
    removeAllByActivityId(activityId: string): Promise<void>;
}

export class DrizzleActivityTagsRepository implements ActivityTagsRepository {
    async add(activityId: string, tagId: string): Promise<void> {
        await db.insert(activityTagsTable).values({ activity_id: activityId, tag_id: tagId });
    }

    async remove(activityId: string, tagId: string): Promise<void> {
        await db
            .delete(activityTagsTable)
            .where(
                and(
                    eq(activityTagsTable.activity_id, activityId),
                    eq(activityTagsTable.tag_id, tagId)
                )
            );
    }

    async getActivityTags(activityId: string): Promise<GetActivityTagType[]> {
        return db
            .select()
            .from(activityTagsTable)
            .where(eq(activityTagsTable.activity_id, activityId));
    }

    async getActivityTagDetails(activityId: string): Promise<Array<InferSelectModel<typeof tagsTable>>> {
        return db
            .select({
                id: tagsTable.id,
                name: tagsTable.name,
                created_at: tagsTable.created_at,
                deleted_at: tagsTable.deleted_at,
            })
            .from(activityTagsTable)
            .innerJoin(tagsTable, eq(activityTagsTable.tag_id, tagsTable.id))
            .where(eq(activityTagsTable.activity_id, activityId));
    }

    async hasTag(activityId: string, tagId: string): Promise<boolean> {
        const result = await db
            .select()
            .from(activityTagsTable)
            .where(
                and(
                    eq(activityTagsTable.activity_id, activityId),
                    eq(activityTagsTable.tag_id, tagId)
                )
            )
            .limit(1);
        return result.length > 0;
    }

    async removeAllByActivityId(activityId: string): Promise<void> {
        await db
            .delete(activityTagsTable)
            .where(eq(activityTagsTable.activity_id, activityId));
    }
}

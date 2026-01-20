import { eq, and, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { userInterestsTable, tagsTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateUserInterestType = InferInsertModel<typeof userInterestsTable>;
type GetUserInterestType = InferSelectModel<typeof userInterestsTable> | undefined;

export interface UserInterestsRepository {
    add(userId: string, tagId: string): Promise<void>;
    remove(userId: string, tagId: string): Promise<void>;
    getUserInterests(userId: string): Promise<GetUserInterestType[]>;
    getUserInterestTags(userId: string): Promise<Array<InferSelectModel<typeof tagsTable>>>;
    hasInterest(userId: string, tagId: string): Promise<boolean>;
    removeAllByUserId(userId: string): Promise<void>;
}

export class DrizzleUserInterestsRepository implements UserInterestsRepository {
    async add(userId: string, tagId: string): Promise<void> {
        await db.insert(userInterestsTable).values({ user_id: userId, tag_id: tagId });
    }

    async remove(userId: string, tagId: string): Promise<void> {
        await db
            .delete(userInterestsTable)
            .where(
                and(
                    eq(userInterestsTable.user_id, userId),
                    eq(userInterestsTable.tag_id, tagId)
                )
            );
    }

    async getUserInterests(userId: string): Promise<GetUserInterestType[]> {
        return db
            .select()
            .from(userInterestsTable)
            .where(eq(userInterestsTable.user_id, userId));
    }

    async getUserInterestTags(userId: string): Promise<Array<InferSelectModel<typeof tagsTable>>> {
        return db
            .select({
                id: tagsTable.id,
                name: tagsTable.name,
                created_at: tagsTable.created_at,
                deleted_at: tagsTable.deleted_at,
            })
            .from(userInterestsTable)
            .innerJoin(tagsTable, eq(userInterestsTable.tag_id, tagsTable.id))
            .where(eq(userInterestsTable.user_id, userId));
    }

    async hasInterest(userId: string, tagId: string): Promise<boolean> {
        const result = await db
            .select()
            .from(userInterestsTable)
            .where(
                and(
                    eq(userInterestsTable.user_id, userId),
                    eq(userInterestsTable.tag_id, tagId)
                )
            )
            .limit(1);
        return result.length > 0;
    }

    async removeAllByUserId(userId: string): Promise<void> {
        await db
            .delete(userInterestsTable)
            .where(eq(userInterestsTable.user_id, userId));
    }
}

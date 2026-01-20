import { and, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "../../lib/drizzle";
import { activityUsersTable } from "../../lib/drizzle/schema";

type GetActivityUser = InferSelectModel<typeof activityUsersTable>;

export interface ActivityUsersRepository {
    join(user_id: string, activity_id: string): Promise<void>;
    leave(user_id: string, activity_id: string): Promise<void>;
    getRegisteredUsers(activity_id: string): Promise<GetActivityUser[]>;
}

export class DrizzleActivityUserRepository implements ActivityUsersRepository {
    async join(user_id: string, activity_id: string): Promise<void> {
        await db.insert(activityUsersTable).values({ user_id, activity_id });
    }

    async leave(user_id: string, activity_id: string): Promise<void> {
        await db
            .delete(activityUsersTable)
            .where(
                and(
                    eq(activityUsersTable.user_id, user_id),
                    eq(activityUsersTable.activity_id, activity_id)
                )
            );
    }

    async getRegisteredUsers(activity_id: string): Promise<GetActivityUser[]> {
        return await db
            .select()
            .from(activityUsersTable)
            .where(eq(activityUsersTable.activity_id, activity_id));
    }
}

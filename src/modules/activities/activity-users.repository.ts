import { and, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "../../lib/drizzle";
import { activityUsersTable } from "../../lib/drizzle/schema";

type GetActivityUser = InferSelectModel<typeof activityUsersTable>;

export interface ActivityUsersRepository {
    join(student_information_id: string, activity_id: string): Promise<void>;
    leave(student_information_id: string, activity_id: string): Promise<void>;
    getRegisteredUsers(activity_id: string): Promise<GetActivityUser[]>;
    isRegistered(student_information_id: string, activity_id: string): Promise<boolean>;
}

export class DrizzleActivityUserRepository implements ActivityUsersRepository {
    async join(student_information_id: string, activity_id: string): Promise<void> {
        await db.insert(activityUsersTable).values({ student_information_id, activity_id });
    }

    async leave(student_information_id: string, activity_id: string): Promise<void> {
        await db
            .delete(activityUsersTable)
            .where(
                and(
                    eq(activityUsersTable.student_information_id, student_information_id),
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

    async isRegistered(student_information_id: string, activity_id: string): Promise<boolean> {
        const result = await db
            .select()
            .from(activityUsersTable)
            .where(
                and(
                    eq(activityUsersTable.student_information_id, student_information_id),
                    eq(activityUsersTable.activity_id, activity_id)
                )
            )
            .limit(1);
        return result.length > 0;
    }
}

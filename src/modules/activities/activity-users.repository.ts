import { and, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "../../lib/drizzle";
import { activityUsersTable } from "../../lib/drizzle/schema";

type GetActivityUser = InferSelectModel<typeof activityUsersTable>;

export interface ActivityUsersRepository {
    join(student_information_id: string, schedule_id: string): Promise<void>;
    leave(student_information_id: string, schedule_id: string): Promise<void>;
    getRegisteredUsers(schedule_id: string): Promise<GetActivityUser[]>;
    isRegistered(student_information_id: string, schedule_id: string): Promise<boolean>;
    getRegisteredCount(schedule_id: string): Promise<number>;
}

export class DrizzleActivityUserRepository implements ActivityUsersRepository {
    async join(student_information_id: string, schedule_id: string): Promise<void> {
        await db.insert(activityUsersTable).values({ student_information_id, schedule_id });
    }

    async leave(student_information_id: string, schedule_id: string): Promise<void> {
        await db
            .delete(activityUsersTable)
            .where(
                and(
                    eq(activityUsersTable.student_information_id, student_information_id),
                    eq(activityUsersTable.schedule_id, schedule_id)
                )
            );
    }

    async getRegisteredUsers(schedule_id: string): Promise<GetActivityUser[]> {
        return await db
            .select()
            .from(activityUsersTable)
            .where(eq(activityUsersTable.schedule_id, schedule_id));
    }

    async isRegistered(student_information_id: string, schedule_id: string): Promise<boolean> {
        const result = await db
            .select()
            .from(activityUsersTable)
            .where(
                and(
                    eq(activityUsersTable.student_information_id, student_information_id),
                    eq(activityUsersTable.schedule_id, schedule_id)
                )
            )
            .limit(1);
        return result.length > 0;
    }

    async getRegisteredCount(schedule_id: string): Promise<number> {
        const { count } = await import("drizzle-orm");
        const result = await db
            .select({ count: count() })
            .from(activityUsersTable)
            .where(eq(activityUsersTable.schedule_id, schedule_id));
        return result[0]?.count ?? 0;
    }
}

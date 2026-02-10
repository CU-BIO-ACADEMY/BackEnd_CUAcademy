import { and, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "../../lib/drizzle";
import { activityUsersTable, studentInformationTable, usersTable } from "../../lib/drizzle/schema";

type GetActivityUser = InferSelectModel<typeof activityUsersTable>;

// Type สำหรับข้อมูล user ที่ลงทะเบียนพร้อมข้อมูลนักเรียน
export type RegisteredUserWithInfo = {
    id: string;
    schedule_id: string;
    student_information_id: string;
    student_info: {
        id: string;
        user_id: string;
        prefix: string;
        full_name: string;
        education_level: number;
        school: string;
    } | null;
    user: {
        id: string;
        email: string;
        display_name: string;
        profile_image_url: string | null;
    } | null;
};

export interface ActivityUsersRepository {
    join(student_information_id: string, schedule_id: string): Promise<void>;
    leave(student_information_id: string, schedule_id: string): Promise<void>;
    getRegisteredUsers(schedule_id: string): Promise<GetActivityUser[]>;
    getRegisteredUsersWithInfo(schedule_id: string): Promise<RegisteredUserWithInfo[]>;
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

    async getRegisteredUsersWithInfo(schedule_id: string): Promise<RegisteredUserWithInfo[]> {
        const result = await db
            .select({
                activity_user: activityUsersTable,
                student_info: studentInformationTable,
                user: usersTable,
            })
            .from(activityUsersTable)
            .innerJoin(
                studentInformationTable,
                eq(activityUsersTable.student_information_id, studentInformationTable.id)
            )
            .innerJoin(
                usersTable,
                eq(studentInformationTable.user_id, usersTable.id)
            )
            .where(eq(activityUsersTable.schedule_id, schedule_id));

        return result.map((row) => ({
            id: row.activity_user.id,
            schedule_id: row.activity_user.schedule_id,
            student_information_id: row.activity_user.student_information_id,
            student_info: row.student_info
                ? {
                    id: row.student_info.id,
                    user_id: row.student_info.user_id,
                    prefix: row.student_info.prefix,
                    full_name: row.student_info.full_name,
                    education_level: row.student_info.education_level,
                    school: row.student_info.school,
                }
                : null,
            user: row.user
                ? {
                    id: row.user.id,
                    email: row.user.email,
                    display_name: row.user.display_name,
                    profile_image_url: row.user.profile_image_url,
                }
                : null,
        }));
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

import { and, eq, inArray, type InferSelectModel } from "drizzle-orm";
import { db } from "../../lib/drizzle";
import { activityUsersTable, filesTable, studentInformationTable, usersTable } from "../../lib/drizzle/schema";

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

export type PendingRegistration = {
    id: string;
    schedule_id: string;
    student_information_id: string;
    payment_status: string;
    payment_file_id: string | null;
    created_at: Date;
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
    payment_file: {
        id: string;
        url: string;
    } | null;
};

export interface ActivityUsersRepository {
    join(student_information_id: string, schedule_id: string, payment_file_id?: string): Promise<void>;
    joinMany(student_information_id: string, schedule_ids: string[], payment_file_id?: string): Promise<void>;
    leave(student_information_id: string, schedule_id: string): Promise<void>;
    getRegisteredUsers(schedule_id: string): Promise<GetActivityUser[]>;
    getRegisteredUsersWithInfo(schedule_id: string): Promise<RegisteredUserWithInfo[]>;
    isRegistered(student_information_id: string, schedule_id: string): Promise<boolean>;
    getRegisteredCount(schedule_id: string): Promise<number>;
    getById(id: string): Promise<GetActivityUser | undefined>;
    updatePaymentStatus(id: string, status: "approved" | "rejected"): Promise<void>;
    getPendingByScheduleIds(schedule_ids: string[]): Promise<PendingRegistration[]>;
}

export class DrizzleActivityUserRepository implements ActivityUsersRepository {
    async join(student_information_id: string, schedule_id: string, payment_file_id?: string): Promise<void> {
        await db.insert(activityUsersTable).values({
            student_information_id,
            schedule_id,
            ...(payment_file_id ? { payment_file_id } : {}),
        });
    }

    async joinMany(student_information_id: string, schedule_ids: string[], payment_file_id?: string): Promise<void> {
        if (schedule_ids.length === 0) return;
        await db.insert(activityUsersTable).values(
            schedule_ids.map((schedule_id) => ({
                student_information_id,
                schedule_id,
                ...(payment_file_id ? { payment_file_id } : {}),
            }))
        );
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

    async getById(id: string): Promise<GetActivityUser | undefined> {
        const result = await db
            .select()
            .from(activityUsersTable)
            .where(eq(activityUsersTable.id, id))
            .limit(1);
        return result[0];
    }

    async updatePaymentStatus(id: string, status: "approved" | "rejected"): Promise<void> {
        await db
            .update(activityUsersTable)
            .set({ payment_status: status })
            .where(eq(activityUsersTable.id, id));
    }

    async getPendingByScheduleIds(schedule_ids: string[]): Promise<PendingRegistration[]> {
        if (schedule_ids.length === 0) return [];
        const result = await db
            .select({
                activity_user: activityUsersTable,
                student_info: studentInformationTable,
                user: usersTable,
                payment_file: filesTable,
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
            .leftJoin(
                filesTable,
                eq(activityUsersTable.payment_file_id, filesTable.id)
            )
            .where(
                and(
                    inArray(activityUsersTable.schedule_id, schedule_ids),
                    eq(activityUsersTable.payment_status, "pending")
                )
            );

        return result.map((row) => ({
            id: row.activity_user.id,
            schedule_id: row.activity_user.schedule_id,
            student_information_id: row.activity_user.student_information_id,
            payment_status: row.activity_user.payment_status,
            payment_file_id: row.activity_user.payment_file_id,
            created_at: row.activity_user.created_at,
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
            payment_file: row.payment_file
                ? {
                    id: row.payment_file.id,
                    url: `${row.payment_file.bucket}/${row.payment_file.key}`,
                }
                : null,
        }));
    }
}

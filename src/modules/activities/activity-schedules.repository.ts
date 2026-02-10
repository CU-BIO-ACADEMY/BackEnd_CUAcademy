import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { db } from "../../lib/drizzle";
import { activitySchedulesTable } from "../../lib/drizzle/schema";

type CreateActivityScheduleType = InferInsertModel<typeof activitySchedulesTable>;
export type GetActivityScheduleType = InferSelectModel<typeof activitySchedulesTable>;



export interface ActivitySchedulesRepository {
    createMany(activity_id: string, schedules: Omit<CreateActivityScheduleType, "activity_id" | "id">[]): Promise<void>;
    getByActivityId(activity_id: string): Promise<GetActivityScheduleType[]>;
    getById(id: string): Promise<GetActivityScheduleType | undefined>;
    getAvailableSchedules(activity_id: string): Promise<GetActivityScheduleType[]>;
    countRegisteredUsers(schedule_id: string): Promise<number>;
}

export class DrizzleActivitySchedulesRepository implements ActivitySchedulesRepository {
    async createMany(
        activity_id: string,
        schedules: Omit<CreateActivityScheduleType, "activity_id" | "id">[]
    ): Promise<void> {
        if (schedules.length === 0) return;
        
        await db.insert(activitySchedulesTable).values(
            schedules.map((schedule) => ({
                ...schedule,
                activity_id,
            }))
        );
    }

    async getByActivityId(activity_id: string): Promise<GetActivityScheduleType[]> {
        return db
            .select()
            .from(activitySchedulesTable)
            .where(eq(activitySchedulesTable.activity_id, activity_id));
    }

    async getById(id: string): Promise<GetActivityScheduleType | undefined> {
        return db
            .select()
            .from(activitySchedulesTable)
            .where(eq(activitySchedulesTable.id, id))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async getAvailableSchedules(activity_id: string): Promise<GetActivityScheduleType[]> {
        // ดึง schedules ทั้งหมดของ activity พร้อมตรวจสอบจำนวนคนที่ลงทะเบียน
        return this.getByActivityId(activity_id);
    }

    async countRegisteredUsers(schedule_id: string): Promise<number> {
        const { count } = await import("drizzle-orm");
        const result = await db
            .select({ count: count() })
            .from(activitySchedulesTable)
            .where(eq(activitySchedulesTable.id, schedule_id));
        return result[0]?.count ?? 0;
    }
}

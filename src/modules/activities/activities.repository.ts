import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { activitiesTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateActivityType = InferInsertModel<typeof activitiesTable>;
export type GetActivityType = InferSelectModel<typeof activitiesTable> | undefined;

export interface ActivityRepository {
    create(data: CreateActivityType): Promise<void>;
    getById(id: string): Promise<GetActivityType>;
    getPublished(): Promise<GetActivityType[]>;
    getUnpublished(): Promise<GetActivityType[]>;
    getByOwnerId(ownerId: string): Promise<GetActivityType[]>;
    approve(activity_id: string): Promise<void>;
}

export class DrizzleActivityRepository implements ActivityRepository {
    async create(data: CreateActivityType): Promise<void> {
        await db.insert(activitiesTable).values(data);
    }

    async getById(id: string): Promise<GetActivityType> {
        return db
            .select()
            .from(activitiesTable)
            .where(eq(activitiesTable.id, id))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async getPublished(): Promise<GetActivityType[]> {
        return db.select().from(activitiesTable).where(eq(activitiesTable.approved, true));
    }

    async getUnpublished(): Promise<GetActivityType[]> {
        return db.select().from(activitiesTable).where(eq(activitiesTable.approved, false));
    }

    async getByOwnerId(ownerId: string): Promise<GetActivityType[]> {
        return db.select().from(activitiesTable).where(eq(activitiesTable.owner_id, ownerId));
    }

    async approve(activity_id: string): Promise<void> {
        await db
            .update(activitiesTable)
            .set({ approved: true })
            .where(eq(activitiesTable.id, activity_id));
    }
}

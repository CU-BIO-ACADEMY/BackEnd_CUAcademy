import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { sessionsTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

export type SessionType = InferSelectModel<typeof sessionsTable>

type CreateSessionType = InferInsertModel<typeof sessionsTable>;
type GetSessionType = SessionType | undefined;

export interface SessionRepository {
    get(id: string): Promise<GetSessionType>;
    create(data: CreateSessionType): Promise<void>;
    delete(id: string): Promise<void>;
}

export class DrizzleSessionRepository implements SessionRepository {
    async get(id: string): Promise<GetSessionType> {
        return await db
            .select()
            .from(sessionsTable)
            .where(eq(sessionsTable.id, id))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async create(data: CreateSessionType): Promise<void> {
        await db.insert(sessionsTable).values(data);
    }

    async delete(id: string): Promise<void> {
        await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
    }
}

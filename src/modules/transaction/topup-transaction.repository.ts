import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { topupTransactionsTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateTopupTransactionType = InferInsertModel<typeof topupTransactionsTable>;
type GetTopupTransactionType = InferSelectModel<typeof topupTransactionsTable>;

export interface TopupTransactionRepository {
    createTopupTransaction(data: CreateTopupTransactionType): Promise<void>;
    getTopupTransactionByPayload(payload: string): Promise<GetTopupTransactionType | undefined>;
}

export class DrizzleTopupTransactionRepository implements TopupTransactionRepository {
    async createTopupTransaction(data: CreateTopupTransactionType): Promise<void> {
        await db.insert(topupTransactionsTable).values(data);
    }

    async getTopupTransactionByPayload(
        payload: string
    ): Promise<GetTopupTransactionType | undefined> {
        return db
            .select()
            .from(topupTransactionsTable)
            .where(eq(topupTransactionsTable.payload, payload))
            .limit(1)
            .then((rows) => rows[0]);
    }
}

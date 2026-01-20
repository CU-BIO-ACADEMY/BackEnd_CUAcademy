import { desc, eq, type InferInsertModel } from "drizzle-orm";
import { transactionsTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateTransactionType = InferInsertModel<typeof transactionsTable>;
type GetTransactionType = InferInsertModel<typeof transactionsTable>;

export interface TransactionRepository {
    createTransaction(data: CreateTransactionType): Promise<void>;
    getTransactions(user_id: string, limit: number, offsets: number): Promise<GetTransactionType[]>;
}

export class DrizzleTransactionRepository implements TransactionRepository {
    async createTransaction(data: CreateTransactionType): Promise<void> {
        await db.insert(transactionsTable).values(data);
    }

    async getTransactions(
        user_id: string,
        limit: number,
        offsets: number
    ): Promise<GetTransactionType[]> {
        return db
            .select()
            .from(transactionsTable)
            .where(eq(transactionsTable.user_id, user_id))
            .orderBy(desc(transactionsTable.created_at))
            .limit(limit)
            .offset(offsets);
    }
}

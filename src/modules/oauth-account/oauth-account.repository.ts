import { and, eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { oAuthAccountTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateOAuthAccountType = InferInsertModel<typeof oAuthAccountTable>;
type GetOAuthAccountType = InferSelectModel<typeof oAuthAccountTable>;

export interface OAuthAccountRepository {
    create(data: CreateOAuthAccountType): Promise<void>;
    getByProviderAccountId(provider: string, providerAccountId: string): Promise<GetOAuthAccountType | undefined>;
    getByUserId(userId: string): Promise<GetOAuthAccountType[]>;
}

export class DrizzleOAuthAccountRepository implements OAuthAccountRepository {
    async create(data: CreateOAuthAccountType): Promise<void> {
        await db.insert(oAuthAccountTable).values(data);
    }

    async getByProviderAccountId(provider: string, providerAccountId: string): Promise<GetOAuthAccountType | undefined> {
        return db
            .select()
            .from(oAuthAccountTable)
            .where(
                and(
                    eq(oAuthAccountTable.provider, provider),
                    eq(oAuthAccountTable.provider_account_id, providerAccountId)
                )
            )
            .limit(1)
            .then((rows) => rows[0]);
    }

    async getByUserId(userId: string): Promise<GetOAuthAccountType[]> {
        return db
            .select()
            .from(oAuthAccountTable)
            .where(eq(oAuthAccountTable.user_id, userId));
    }
}

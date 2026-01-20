import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { usersTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateUserType = InferInsertModel<typeof usersTable>;
type GetUserType = InferSelectModel<typeof usersTable>;

export interface UserRepository {
    create(data: CreateUserType): Promise<void>;
    getUserById(id: string): Promise<GetUserType | undefined>;
    getUserByEmail(email: string): Promise<GetUserType | undefined>;
    updateProfile(userId: string, email: string, displayName: string, profileImageUrl?: string): Promise<void>;
    setUserBalance(userId: string, balance: number): Promise<void>;
}

export class DrizzleUserRepository implements UserRepository {
    async create(data: CreateUserType): Promise<void> {
        await db.insert(usersTable).values(data);
    }

    async getUserById(id: string): Promise<GetUserType | undefined> {
        return db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, id))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async getUserByEmail(email: string): Promise<GetUserType | undefined> {
        return db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async updateProfile(userId: string, email: string, displayName: string, profileImageUrl?: string): Promise<void> {
        await db
            .update(usersTable)
            .set({
                email,
                display_name: displayName,
                profile_image_url: profileImageUrl,
                updated_at: new Date(),
            })
            .where(eq(usersTable.id, userId));
    }

    async setUserBalance(user_id: string, balance: number): Promise<void> {
        await db
            .update(usersTable)
            .set({ balance: balance })
            .where(eq(usersTable.id, user_id));
    }
}

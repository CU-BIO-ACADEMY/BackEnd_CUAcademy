import { eq, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { studentInformationTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

type CreateStudentInformationType = InferInsertModel<typeof studentInformationTable>;
type StudentInformationType = InferSelectModel<typeof studentInformationTable>;

export interface StudentInformationRepository {
    create(data: CreateStudentInformationType): Promise<void>;
    getByUserId(userId: string): Promise<StudentInformationType | undefined>;
    getAllByUserId(userId: string): Promise<StudentInformationType[]>;
    getById(id: string): Promise<StudentInformationType | undefined>;
    update(userId: string, data: Partial<Omit<CreateStudentInformationType, "id" | "user_id" | "created_at">>): Promise<void>;
    updateById(id: string, data: Partial<Omit<CreateStudentInformationType, "id" | "user_id" | "created_at">>): Promise<void>;
    delete(userId: string): Promise<void>;
    deleteById(id: string): Promise<void>;
    existsByUserId(userId: string): Promise<boolean>;
    existsByIdAndUserId(id: string, userId: string): Promise<boolean>;
}

export class DrizzleStudentInformationRepository implements StudentInformationRepository {
    async create(data: CreateStudentInformationType): Promise<void> {
        await db.insert(studentInformationTable).values(data);
    }

    async getByUserId(userId: string): Promise<StudentInformationType | undefined> {
        const result = await db
            .select()
            .from(studentInformationTable)
            .where(eq(studentInformationTable.user_id, userId))
            .limit(1);
        return result[0];
    }

    async getAllByUserId(userId: string): Promise<StudentInformationType[]> {
        return await db
            .select()
            .from(studentInformationTable)
            .where(eq(studentInformationTable.user_id, userId));
    }

    async getById(id: string): Promise<StudentInformationType | undefined> {
        const result = await db
            .select()
            .from(studentInformationTable)
            .where(eq(studentInformationTable.id, id))
            .limit(1);
        return result[0];
    }

    async update(userId: string, data: Partial<Omit<CreateStudentInformationType, "id" | "user_id" | "created_at">>): Promise<void> {
        await db
            .update(studentInformationTable)
            .set({ ...data, updated_at: new Date() })
            .where(eq(studentInformationTable.user_id, userId));
    }

    async updateById(id: string, data: Partial<Omit<CreateStudentInformationType, "id" | "user_id" | "created_at">>): Promise<void> {
        await db
            .update(studentInformationTable)
            .set({ ...data, updated_at: new Date() })
            .where(eq(studentInformationTable.id, id));
    }

    async delete(userId: string): Promise<void> {
        await db
            .delete(studentInformationTable)
            .where(eq(studentInformationTable.user_id, userId));
    }

    async deleteById(id: string): Promise<void> {
        await db
            .delete(studentInformationTable)
            .where(eq(studentInformationTable.id, id));
    }

    async existsByUserId(userId: string): Promise<boolean> {
        const result = await db
            .select()
            .from(studentInformationTable)
            .where(eq(studentInformationTable.user_id, userId))
            .limit(1);
        return result.length > 0;
    }

    async existsByIdAndUserId(id: string, userId: string): Promise<boolean> {
        const result = await db
            .select()
            .from(studentInformationTable)
            .where(eq(studentInformationTable.id, id) && eq(studentInformationTable.user_id, userId))
            .limit(1);
        return result.length > 0;
    }
}

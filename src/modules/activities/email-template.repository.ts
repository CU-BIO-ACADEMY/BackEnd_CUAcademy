import { eq, type InferSelectModel } from "drizzle-orm";
import { emailTemplatesTable } from "../../lib/drizzle/schema";
import { db } from "../../lib/drizzle";

export type GetEmailTemplateType = InferSelectModel<typeof emailTemplatesTable>;

export interface EmailTemplateRepository {
    getByActivityId(activityId: string): Promise<GetEmailTemplateType | undefined>;
    upsert(activityId: string, subject: string, body: string): Promise<void>;
}

export class DrizzleEmailTemplateRepository implements EmailTemplateRepository {
    async getByActivityId(activityId: string): Promise<GetEmailTemplateType | undefined> {
        return db
            .select()
            .from(emailTemplatesTable)
            .where(eq(emailTemplatesTable.activity_id, activityId))
            .limit(1)
            .then((rows) => rows[0]);
    }

    async upsert(activityId: string, subject: string, body: string): Promise<void> {
        await db
            .insert(emailTemplatesTable)
            .values({ activity_id: activityId, subject, body })
            .onConflictDoUpdate({
                target: emailTemplatesTable.activity_id,
                set: { subject, body, updated_at: new Date() },
            });
    }
}

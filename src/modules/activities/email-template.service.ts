import { env } from "../../config/env";
import { NotFoundError } from "../../lib/error";
import type { ResendService } from "../thrid-party/resend/resend.service";
import type { ActivitiesService } from "./activities.service";
import type { EmailTemplateRepository, GetEmailTemplateType } from "./email-template.repository";

export class EmailTemplateService {
    constructor(
        private readonly emailTemplateRepository: EmailTemplateRepository,
        private readonly activitiesService: ActivitiesService,
        private readonly resendService: ResendService
    ) {}

    async getByActivityId(activityId: string): Promise<GetEmailTemplateType | undefined> {
        return this.emailTemplateRepository.getByActivityId(activityId);
    }

    async upsert(activityId: string, subject: string, body: string): Promise<void> {
        const activity = await this.activitiesService.getActivityDetail(activityId);
        if (!activity) {
            throw new NotFoundError("ไม่พบกิจกรรมนี้");
        }

        await this.emailTemplateRepository.upsert(activityId, subject, body);
    }

    async sendEmails(activityId: string, registrationIds: string[]): Promise<{ sent: number }> {
        const template = await this.emailTemplateRepository.getByActivityId(activityId);
        if (!template) {
            throw new NotFoundError("ไม่พบรูปแบบ Email กรุณาสร้างรูปแบบ Email ก่อน");
        }

        const activity = await this.activitiesService.getActivityDetail(activityId);

        // Build a map of all approved registrations with their rank
        const approvedRegistrations: {
            id: string;
            email: string;
            prefix: string;
            fullName: string;
            school: string;
            eventStartAt: Date;
            price: number;
            rank: number;
        }[] = [];

        let rankCounter = 1;
        for (const schedule of activity.schedules) {
            const approvedUsers = schedule.registered_users
                .filter((u) => u.payment_status === "approved")
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            for (const user of approvedUsers) {
                if (!user.student_info || !user.user) continue;

                approvedRegistrations.push({
                    id: user.id,
                    email: user.user.email,
                    prefix: user.student_info.prefix,
                    fullName: user.student_info.full_name,
                    school: user.student_info.school,
                    eventStartAt: new Date(schedule.event_start_at),
                    price: schedule.price,
                    rank: rankCounter++,
                });
            }
        }

        // Filter to only the requested registration IDs
        const targetRegistrations = approvedRegistrations.filter((r) =>
            registrationIds.includes(r.id)
        );

        if (targetRegistrations.length === 0) {
            throw new NotFoundError("ไม่พบผู้สมัครที่ต้องการส่งอีเมล");
        }

        const emails = targetRegistrations.map((reg) => {
            const thaiDate = reg.eventStartAt.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            const startTime = reg.eventStartAt.toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
            });

            const replacePlaceholders = (text: string) =>
                text
                    .replace(/\{prefix\}/g, reg.prefix)
                    .replace(/\{name\}/g, reg.fullName)
                    .replace(/\{school\}/g, reg.school)
                    .replace(/\{date\}/g, thaiDate)
                    .replace(/\{money\}/g, reg.price.toString())
                    .replace(/\{id\}/g, reg.rank.toString())
                    .replace(/\{rank\}/g, reg.rank.toString())
                    .replace(/\{startTime\}/g, startTime)
                    .replace(/\{endTime\}/g, "-")
                    .replace(/\{email\}/g, env.RESEND_FROM_EMAIL);

            const subject = replacePlaceholders(template.subject);
            const bodyHtml = replacePlaceholders(template.body)
                .split("\n")
                .join("<br>");

            return {
                to: reg.email,
                subject,
                html: bodyHtml,
            };
        });

        if (emails.length === 1) {
            await this.resendService.sendEmail(emails[0]!);
        } else {
            await this.resendService.sendBatchEmails(emails);
        }

        return { sent: emails.length };
    }
}

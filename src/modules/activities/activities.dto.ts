import z from "zod";

export const activityScheduleSchema = z.object({
    event_start_at: z.string().transform((val) => new Date(val)),
    price: z.coerce.number().min(0, { error: "ค่าเรียนต้องมีค่ามากกว่าหรือเท่ากับ 0" }),
    max_users: z.coerce.number().min(1, { error: "ผู้เข้าร่วมกิจกรรมต้องมีอย่างน้อย 1 คน" }),
});

export type ActivityScheduleDto = z.infer<typeof activityScheduleSchema>;

export const createActivitySchema = z
    .object({
        title: z.string().min(1, { error: "ชื่อกิจกรรมต้องมีอย่างน้อย 1 ตัวอักษร" }),
        description: z.string().min(1, { error: "รายละเอียดกิจกรรมต้องมีอย่างน้อย 1 ตัวอักษร" }),
        description_short: z
            .string()
            .min(1, { error: "รายละเอียดกิจกรรมต้องมีอย่างน้อย 1 ตัวอักษร" }),
        registration_open_at: z.string().transform((val) => new Date(val)),
        registration_close_at: z.string().transform((val) => new Date(val)),
        schedules: z.string().transform((val) => {
            try {
                const parsed = JSON.parse(val);
                return z.array(activityScheduleSchema).parse(parsed);
            } catch {
                throw new Error("รูปแบบข้อมูลกำหนดการไม่ถูกต้อง");
            }
        }),
    })
    .refine((data) => data.registration_close_at > data.registration_open_at, {
        error: "วันปิดรับสมัครต้องมาหลังวันเปิดรับสมัคร",
        path: ["registration_close_at"],
    })
    .refine((data) => data.schedules.length > 0, {
        error: "ต้องมีกำหนดการอย่างน้อย 1 รอบ",
        path: ["schedules"],
    })
    .refine(
        (data) => {
            return data.schedules.every(
                (schedule) => schedule.event_start_at > data.registration_close_at
            );
        },
        {
            error: "วันเริ่มกิจกรรมทุกรอบต้องมาหลังวันปิดรับสมัคร",
            path: ["schedules"],
        }
    );

export type CreateActivityDto = z.infer<typeof createActivitySchema>;

export const createActivityWithFilesSchema = createActivitySchema.extend({
    attachments_metadata: z.string().optional().transform((val) => {
        if (!val) return [];
        try {
            return JSON.parse(val);
        } catch {
            return [];
        }
    }),
});

export type CreateActivityWithFilesDto = z.infer<typeof createActivityWithFilesSchema>;

export const joinActivitySchema = z.object({
    student_information_id: z.uuid("รหัสข้อมูลนักเรียนไม่ถูกต้อง"),
    schedule_ids: z.string().transform((val) => {
        const parsed = JSON.parse(val);
        return z.array(z.string().uuid()).min(1, "ต้องเลือกอย่างน้อย 1 รอบ").parse(parsed);
    }),
});

export type JoinActivityDto = z.infer<typeof joinActivitySchema>;

export const updateRegistrationStatusSchema = z.object({
    status: z.enum(["approved", "rejected"]),
});

export type AttachmentMetadata = {
    display_name?: string;
};

export const upsertEmailTemplateSchema = z.object({
    subject: z.string().min(1, { error: "กรุณากรอกหัวข้อ Email" }),
    body: z.string().min(1, { error: "กรุณากรอกเนื้อหา Email" }),
});

export const sendEmailsSchema = z.object({
    registration_ids: z.array(z.string().uuid()).min(1, { error: "กรุณาเลือกผู้สมัครอย่างน้อย 1 คน" }),
});


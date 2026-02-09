import z from "zod";

export const createActivitySchema = z
    .object({
        title: z.string().min(1, { error: "ชื่อกิจกรรมต้องมีอย่างน้อย 1 ตัวอักษร" }),
        description: z.string().min(1, { error: "รายละเอียดกิจกรรมต้องมีอย่างน้อย 1 ตัวอักษร" }),
        description_short: z
            .string()
            .min(1, { error: "รายละเอียดกิจกรรมต้องมีอย่างน้อย 1 ตัวอักษร" }),
        max_users: z.coerce.number().min(1, { error: "ผู้เข้าร่วมกิจกรรมต้องมีอย่างน้อย 1 คน" }),
        price: z.coerce.number().min(0, { error: "ค่าเรียนต้องมีค่ามากกว่าหรือเท่ากับ 0" }),
        registration_open_at: z.string().transform((val) => new Date(val)),
        registration_close_at: z.string().transform((val) => new Date(val)),
        event_start_at: z.string().transform((val) => new Date(val)),
    })
    .refine((data) => data.registration_close_at > data.registration_open_at, {
        error: "วันปิดรับสมัครต้องมาหลังวันเปิดรับสมัคร",
        path: ["registration_close_at"],
    })
    .refine((data) => data.event_start_at > data.registration_close_at, {
        error: "วันเริ่มกิจกรรมต้องมาหลังวันปิดรับสมัคร",
        path: ["event_start_at"],
    });

export type CreateActivityDto = z.infer<typeof createActivitySchema>;

// Schema for creating activity with attachments (files metadata from multipart form)
export const createActivityWithFilesSchema = createActivitySchema.extend({
    // attachments metadata as JSON string (file info like display_name)
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
    student_information_id: z.string().uuid("รหัสข้อมูลนักเรียนไม่ถูกต้อง"),
});

export type JoinActivityDto = z.infer<typeof joinActivitySchema>;

// Attachment metadata type
export type AttachmentMetadata = {
    display_name?: string;
};

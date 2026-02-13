import { z } from "zod";

export const educationLevelMap: Record<string, number> = {
    "ม. 2": 2,
    "ม. 3": 3,
    "ม. 4": 4,
    "ม. 5": 5,
    "ม. 6": 6,
};

export const createStudentInformationSchema = z.object({
    prefix: z.string().min(1, "กรุณาเลือกคำนำหน้า"),
    full_name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุลนักเรียน"),
    education_level: z
        .number()
        .int("ระดับการศึกษาต้องเป็นจำนวนเต็ม")
        .min(1, "ระดับการศึกษาต้องอยู่ระหว่าง 1-6")
        .max(6, "ระดับการศึกษาต้องอยู่ระหว่าง 1-6"),
    school: z.string().min(1, "กรุณากรอกชื่อโรงเรียน"),
    food_allergies: z.string().optional(),
    parent_name: z.string().min(1, "กรุณากรอกชื่อผู้ปกครอง"),
    parent_email: z.email("รูปแบบอีเมลไม่ถูกต้อง"),
    secondary_email: z.email("รูปแบบอีเมลไม่ถูกต้อง").optional(),
    phone_number: z.string().min(1, "กรุณากรอกเบอร์โทรศัพท์"),
});

export const updateStudentInformationSchema = createStudentInformationSchema.partial();

export type CreateStudentInformationDTO = z.infer<typeof createStudentInformationSchema>;
export type UpdateStudentInformationDTO = z.infer<typeof updateStudentInformationSchema>;

import { NotFoundError, ForbiddenError } from "../../lib/error";
import type { StudentInformationRepository } from "./student-information.repository";
import type { UserService } from "../user/user.service";
import type { CreateStudentInformationDTO, UpdateStudentInformationDTO } from "./student-information.dto";
import type { InferSelectModel } from "drizzle-orm";
import type { studentInformationTable } from "../../lib/drizzle/schema";

export class StudentInformationService {
    constructor(
        private studentInformationRepository: StudentInformationRepository,
        private userService: UserService
    ) {}

    async createStudentInformation(userId: string, data: CreateStudentInformationDTO): Promise<void> {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("ไม่พบผู้ใช้");
        }

        await this.studentInformationRepository.create({
            user_id: userId,
            prefix: data.prefix,
            full_name: data.full_name,
            education_level: data.education_level,
            school: data.school,
            food_allergies: data.food_allergies || null,
            parent_name: data.parent_name,
            parent_email: data.parent_email,
            secondary_email: data.secondary_email || null,
            phone_number: data.phone_number || null,
        });
    }

    async getStudentInformation(userId: string): Promise<InferSelectModel<typeof studentInformationTable>> {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("ไม่พบผู้ใช้");
        }

        const info = await this.studentInformationRepository.getByUserId(userId);
        if (!info) {
            throw new NotFoundError("ไม่พบข้อมูลนักเรียน");
        }

        return info;
    }

    async getAllStudentInformation(userId: string): Promise<InferSelectModel<typeof studentInformationTable>[]> {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("ไม่พบผู้ใช้");
        }

        return await this.studentInformationRepository.getAllByUserId(userId);
    }

    async updateStudentInformation(
        userId: string,
        studentInfoId: string,
        data: UpdateStudentInformationDTO
    ): Promise<void> {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("ไม่พบผู้ใช้");
        }

        const exists = await this.studentInformationRepository.existsByIdAndUserId(studentInfoId, userId);
        if (!exists) {
            throw new NotFoundError("ไม่พบข้อมูลนักเรียน หรือคุณไม่มีสิทธิ์แก้ไข");
        }

        await this.studentInformationRepository.updateById(studentInfoId, {
            prefix: data.prefix,
            full_name: data.full_name,
            education_level: data.education_level,
            school: data.school,
            food_allergies: data.food_allergies,
            parent_name: data.parent_name,
            parent_email: data.parent_email,
            secondary_email: data.secondary_email,
            phone_number: data.phone_number,
        });
    }

    async deleteStudentInformation(userId: string, studentInfoId: string): Promise<void> {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("ไม่พบผู้ใช้");
        }

        const exists = await this.studentInformationRepository.existsByIdAndUserId(studentInfoId, userId);
        if (!exists) {
            throw new NotFoundError("ไม่พบข้อมูลนักเรียน หรือคุณไม่มีสิทธิ์ลบ");
        }

        await this.studentInformationRepository.deleteById(studentInfoId);
    }

    async hasStudentInformation(userId: string): Promise<boolean> {
        return this.studentInformationRepository.existsByUserId(userId);
    }
}

import type { Response } from "express";
import type { StudentInformationService } from "./student-information.service";
import type { AuthenticatedRequest } from "../../types/express";
import { handleError, BadRequestError } from "../../lib/error";
import { createStudentInformationSchema, updateStudentInformationSchema } from "./student-information.dto";

export class StudentInformationController {
    constructor(private readonly studentInformationService: StudentInformationService) {}

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const data = createStudentInformationSchema.parse(req.body);

            await this.studentInformationService.createStudentInformation(req.session.user_id, data);

            res.status(201).json({ message: "สร้างข้อมูลนักเรียนสำเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }

    async get(req: AuthenticatedRequest, res: Response) {
        try {
            const info = await this.studentInformationService.getStudentInformation(req.session.user_id);

            res.json(info);
        } catch (error) {
            handleError(res, error);
        }
    }

    async getAll(req: AuthenticatedRequest, res: Response) {
        try {
            const infos = await this.studentInformationService.getAllStudentInformation(req.session.user_id);

            res.json(infos);
        } catch (error) {
            handleError(res, error);
        }
    }

    async update(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new BadRequestError("กรุณาระบุรหัสข้อมูลนักเรียน");
            }

            const data = updateStudentInformationSchema.parse(req.body);

            await this.studentInformationService.updateStudentInformation(req.session.user_id, id, data);

            res.json({ message: "อัพเดทข้อมูลนักเรียนสำเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }

    async delete(req: AuthenticatedRequest, res: Response) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new BadRequestError("กรุณาระบุรหัสข้อมูลนักเรียน");
            }

            await this.studentInformationService.deleteStudentInformation(req.session.user_id, id);

            res.json({ message: "ลบข้อมูลนักเรียนสำเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }

    async checkExists(req: AuthenticatedRequest, res: Response) {
        try {
            const exists = await this.studentInformationService.hasStudentInformation(req.session.user_id);

            res.json({ exists });
        } catch (error) {
            handleError(res, error);
        }
    }
}

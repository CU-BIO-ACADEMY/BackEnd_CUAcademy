import type { Response } from "express";
import type { ActivitiesService } from "./activities.service";
import type { AuthenticatedRequest } from "../../types/express";
import { BadRequestError, handleError, NotFoundError } from "../../lib/error";
import {
    createActivityWithFilesSchema,
    joinActivitySchema,
    updateRegistrationStatusSchema,
    type AttachmentMetadata,
} from "./activities.dto";
import { v4 } from "uuid";

export class ActivityController {
    constructor(private readonly activityService: ActivitiesService) {}

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

            // Check for thumbnail in files (from multer.fields)
            let thumbnailFile: Express.Multer.File | undefined;

            if (files && files.thumbnail && files.thumbnail.length > 0) {
                thumbnailFile = files.thumbnail[0];
            }

            if (!thumbnailFile) {
                throw new NotFoundError("โปรดใส่ภาพหลัก");
            }

            const attachments = files?.attachments || [];

            const data = createActivityWithFilesSchema.parse(req.body);
            const attachmentsMetadata: AttachmentMetadata[] = data.attachments_metadata || [];

            const ext = thumbnailFile.originalname.split(".").pop() || "";
            const thumbnailFilename = `${v4()}.${ext}`;

            // Destructure to exclude attachments_metadata
            const { attachments_metadata: _, ...activityData } = data;

            await this.activityService.createActivityWithFiles({
                user_id: req.session.user_id,
                title: activityData.title,
                description: activityData.description,
                description_short: activityData.description_short,
                registration_open_at: activityData.registration_open_at,
                registration_close_at: data.registration_close_at,
                schedules: activityData.schedules,
                thumbnail: {
                    file: thumbnailFile.buffer,
                    filename: thumbnailFilename,
                    mimetype: thumbnailFile.mimetype,
                    size: thumbnailFile.size,
                },
                attachments: attachments.map((file, index) => ({
                    file: file.buffer,
                    filename: `${v4()}.${file.originalname.split(".").pop() || ""}`,
                    mimetype: file.mimetype,
                    size: file.size,
                    display_name: attachmentsMetadata[index]?.display_name || file.originalname,
                })),
            });

            res.json({ message: "สร้างกิจกรรมสําเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }

    async getAllActivities(req: AuthenticatedRequest, res: Response) {
        try {
            const activities = await this.activityService.getPublishedActivities();

            res.json(activities);
        } catch (error) {
            handleError(res, error);
        }
    }

    async getActivity(req: AuthenticatedRequest, res: Response) {
        try {
            const activity_id = req.params.id;

            if (!activity_id) throw new BadRequestError("ไม่พบกิจกรรมนี้");

            const data = await this.activityService.getActivityDetail(activity_id);

            res.json(data);
        } catch (error) {
            handleError(res, error);
        }
    }

    async joinActivity(req: AuthenticatedRequest, res: Response) {
        try {
            const activity_id = req.params.id;

            if (!activity_id) throw new BadRequestError("ไม่พบ id");

            const data = joinActivitySchema.parse(req.body);

            let paymentFile: { file: Buffer; filename: string; mimetype: string; size: number } | undefined;
            const file = req.file as Express.Multer.File | undefined;
            if (file) {
                const ext = file.originalname.split(".").pop() || "";
                paymentFile = {
                    file: file.buffer,
                    filename: `${v4()}.${ext}`,
                    mimetype: file.mimetype,
                    size: file.size,
                };
            }

            await this.activityService.joinActivity(
                req.session.user_id,
                activity_id,
                data.schedule_ids,
                data.student_information_id,
                paymentFile
            );

            res.json({ message: "สมัครกิจกรรมสำเร็จ รอการอนุมัติ" });
        } catch (error) {
            handleError(res, error);
        }
    }

    async getPendingRegistrations(req: AuthenticatedRequest, res: Response) {
        try {
            const activity_id = req.params.id;
            if (!activity_id) throw new BadRequestError("ไม่พบ id");

            const registrations = await this.activityService.getActivityPendingRegistrations(activity_id);
            res.json(registrations);
        } catch (error) {
            handleError(res, error);
        }
    }

    async updateRegistrationStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const registration_id = req.params.registrationId;
            if (!registration_id) throw new BadRequestError("ไม่พบ id");

            const data = updateRegistrationStatusSchema.parse(req.body);
            await this.activityService.updateRegistrationStatus(registration_id, data.status);

            res.json({ message: "อัพเดทสถานะสำเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }

    async approve(req: AuthenticatedRequest, res: Response) {
        try {
            const activit_id = req.params.id;

            if (!activit_id) throw new BadRequestError("ไม่พบ id");

            this.activityService.approveActivity(activit_id);

            res.json({ message: "อนุมัติกิจกรรมสําเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }

    async getUnpublishedActivities(req: AuthenticatedRequest, res: Response) {
        try {
            const activities = await this.activityService.getUnpublishedActivities();

            res.json(activities);
        } catch (error) {
            handleError(res, error);
        }
    }
}

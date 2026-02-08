import type { Response } from "express";
import type { ActivitiesService } from "./activities.service";
import type { AuthenticatedRequest } from "../../types/express";
import { BadRequestError, handleError, NotFoundError } from "../../lib/error";
import { createActivitySchema, joinActivitySchema } from "./activities.dto";
import { v4 } from "uuid";

export class ActivityController {
    constructor(private readonly activityService: ActivitiesService) {}

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.file) throw new NotFoundError("โปรดใส่ภาพหลัก");

            const ext = req.file.originalname.split(".").pop() || "";
            const filename = `${v4()}.${ext}`;

            const data = createActivitySchema.parse(req.body);

            await this.activityService.createActivity({
                user_id: req.session.user_id,
                title: data.title,
                description: data.description,
                description_short: data.description_short,
                max_users: data.max_users,
                price: data.price,
                registration_open_at: data.registration_open_at,
                registration_close_at: data.registration_close_at,
                event_start_at: data.event_start_at,
                file: req.file.buffer,
                filename: filename,
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

    async joinActivity(req: AuthenticatedRequest, res: Response) {
        try {
            const activity_id = req.params.id;

            if (!activity_id) throw new BadRequestError("ไม่พบ id");

            const data = joinActivitySchema.parse(req.body);

            await this.activityService.joinActivity(req.session.user_id, activity_id, data.student_information_id);

            res.json({ message: "สมัครกิจกรรมสำเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }

    async approve(req: AuthenticatedRequest, res: Response) {
        try {
            const activit_id = req.params.id;

            if (!activit_id) throw new BadRequestError("ไม่พบ id");

            this.activityService.approveActivity(activit_id);
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

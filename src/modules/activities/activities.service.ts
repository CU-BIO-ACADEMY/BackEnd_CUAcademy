import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/error";
import type { ActivityRepository, GetActivityType } from "./activities.repository";
import type { UserService } from "../user/user.service";
import type { CreateActivityDto } from "./activities.dto";
import type { FileService } from "../files/files.service";
import type { ActivityUserService } from "./activity-users.service";

type CreateActivityType = CreateActivityDto & { user_id: string; file: Buffer; filename: string };

export class ActivitiesService {
    constructor(
        private readonly activityRepository: ActivityRepository,
        private readonly activityUserService: ActivityUserService,
        private readonly userService: UserService,
        private readonly fileService: FileService
    ) {}

    async createActivity(data: CreateActivityType) {
        const owner = await this.userService.getUserById(data.user_id);

        if (!owner) throw new NotFoundError("Owner not found");

        const file_id = await this.fileService.createFile({
            file: data.file,
            key: data.filename,
        });

        await this.activityRepository.create({
            owner_id: owner.id,
            title: data.title,
            thumbnail_file_id: file_id,
            description: data.description,
            description_short: data.description_short,
            max_users: data.max_users,
            price: data.price,
            event_start_at: data.event_start_at,
            registration_open_at: data.registration_open_at,
            registration_close_at: data.registration_close_at,
        });
    }

    async getActivityById(id: string) {
        const activity = await this.activityRepository.getById(id);
        if (!activity) {
            throw new NotFoundError("Activity not found");
        }
        return activity;
    }

    private async getAllActivities(call: () => Promise<GetActivityType[]>) {
        const activities = await call();

        const validActivities = activities.filter((activity) => activity !== undefined);

        const activitiesWithThumbnails = await Promise.all(
            validActivities.map(async (activity) => {
                const file = await this.fileService.getFileById(activity.thumbnail_file_id);
                const users = await this.activityUserService.getRegisteredUsers(activity.id);

                return {
                    ...activity,
                    thumbnail_url: file.url,
                    users_registered: users.length,
                };
            })
        );

        return activitiesWithThumbnails;
    }

    async getPublishedActivities() {
        return await this.getAllActivities(this.activityRepository.getPublished);
    }

    async getUnpublishedActivities() {
        return await this.getAllActivities(this.activityRepository.getUnpublished);
    }

    async getActivitiesByOwner(ownerId: string) {
        const owner = await this.userService.getUserById(ownerId);

        if (!owner) throw new NotFoundError("Owner not found");

        return this.activityRepository.getByOwnerId(ownerId);
    }

    async joinActivity(user_id: string, activity_id: string) {
        const activity = await this.activityRepository.getById(activity_id);

        if (!activity) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการอนุมัติ");

        if (!activity.approved) throw new ForbiddenError("กิจกรรมนี้ยังไม่ถูกอนุมัติ");

        const now = new Date();

        if (now < activity.registration_open_at) {
            throw new ForbiddenError("กิจกรรมนี้ไม่เปิดรับสมัคร");
        }

        if (now > activity.registration_close_at) {
            throw new ForbiddenError("กิจกรรมนี้ปิดรับสมัครแล้ว");
        }

        const balance = await this.userService.getuserBalance(user_id);

        if (balance < activity.price) {
            throw new ForbiddenError("ยอดเงินไม่เพียงพอ");
        }

        await this.userService.setUserBalance(user_id, balance - activity.price);

        await this.activityUserService.join(user_id, activity_id);
    }

    async approveActivity(activity_id: string) {
        const activity = await this.activityRepository.getById(activity_id);

        if (!activity) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการอนุมัติ");

        if (activity.approved) throw new ConflictError("กิจกรรมนี้ถูกอนุมัติแล้ว");

        await this.activityRepository.approve(activity_id);
    }
}

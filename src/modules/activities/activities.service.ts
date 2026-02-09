import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/error";
import type { ActivityRepository, GetActivityType } from "./activities.repository";
import type { UserService } from "../user/user.service";
import type { CreateActivityDto, CreateActivityWithFilesDto } from "./activities.dto";
import type { FileService } from "../files/files.service";
import type { ActivityUserService } from "./activity-users.service";
import type { StudentInformationService } from "../student-information/student-information.service";
import type { ActivityFilesService } from "./activity-files.service";
import type { FileType } from "../../lib/drizzle/schema";

export type CreateActivityType = CreateActivityDto & { 
    user_id: string; 
    file: Buffer; 
    filename: string;
    mimetype: string;
    size: number;
};

export type CreateActivityWithFilesType = Omit<CreateActivityWithFilesDto, 'attachments_metadata'> & {
    user_id: string;
    thumbnail: {
        file: Buffer;
        filename: string;
        mimetype: string;
        size: number;
    };
    attachments?: {
        file: Buffer;
        filename: string;
        mimetype: string;
        size: number;
        display_name?: string;
    }[];
};

export class ActivitiesService {
    constructor(
        private readonly activityRepository: ActivityRepository,
        private readonly activityUserService: ActivityUserService,
        private readonly userService: UserService,
        private readonly fileService: FileService,
        private readonly activityFilesService: ActivityFilesService,
        private readonly studentInformationService: StudentInformationService
    ) {}

    async createActivity(data: CreateActivityType) {
        const owner = await this.userService.getUserById(data.user_id);

        if (!owner) throw new NotFoundError("Owner not found");

        const file_id = await this.fileService.createFile({
            file: data.file,
            key: data.filename,
            filename: data.filename,
            mimetype: data.mimetype,
            size: data.size,
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

    async createActivityWithFiles(data: CreateActivityWithFilesType) {
        const owner = await this.userService.getUserById(data.user_id);

        if (!owner) throw new NotFoundError("Owner not found");

        // Create thumbnail file
        const thumbnail_file_id = await this.fileService.createFile({
            file: data.thumbnail.file,
            key: data.thumbnail.filename,
            filename: data.thumbnail.filename,
            mimetype: data.thumbnail.mimetype,
            size: data.thumbnail.size,
        });

        // Create activity
        await this.activityRepository.create({
            owner_id: owner.id,
            title: data.title,
            thumbnail_file_id: thumbnail_file_id,
            description: data.description,
            description_short: data.description_short,
            max_users: data.max_users,
            price: data.price,
            event_start_at: data.event_start_at,
            registration_open_at: data.registration_open_at,
            registration_close_at: data.registration_close_at,
        });

        // Get the created activity to get its ID
        // Note: We need to get the activity by some unique identifier
        // For now, we'll assume the activity was just created and get the latest one
        // In production, you might want to return the ID from the create method
        const activities = await this.activityRepository.getByOwnerId(owner.id);
        const createdActivity = activities[activities.length - 1];

        if (!createdActivity) {
            throw new NotFoundError("Failed to create activity");
        }

        // Create attachment files if any
        if (data.attachments && data.attachments.length > 0) {
            await this.activityFilesService.createManyActivityFiles(
                createdActivity.id,
                data.attachments,
                "attachment"
            );
        }

        return createdActivity;
    }

    async getActivityWithFiles(id: string) {
        const activity = await this.activityRepository.getById(id);
        if (!activity) {
            throw new NotFoundError("Activity not found");
        }

        const thumbnail = await this.fileService.getFileById(activity.thumbnail_file_id);
        const attachments = await this.activityFilesService.getActivityFiles(id);
        const users = await this.activityUserService.getRegisteredUsers(activity.id);

        return {
            ...activity,
            thumbnail: {
                id: thumbnail.id,
                filename: thumbnail.filename,
                mimetype: thumbnail.mimetype,
                size: thumbnail.size,
                url: thumbnail.url,
            },
            attachments: attachments.map((att) => ({
                id: att.id,
                file_id: att.file_id,
                file_type: att.file_type,
                display_name: att.display_name,
                file: att.file,
            })),
            users_registered: users.length,
        };
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

    async joinActivity(user_id: string, activity_id: string, student_information_id: string) {
        const activity = await this.activityRepository.getById(activity_id);

        if (!activity) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการสมัคร");

        if (!activity.approved) throw new ForbiddenError("กิจกรรมนี้ยังไม่ถูกอนุมัติ");

        const now = new Date();

        if (now < activity.registration_open_at) {
            throw new ForbiddenError("กิจกรรมนี้ไม่เปิดรับสมัคร");
        }

        if (now > activity.registration_close_at) {
            throw new ForbiddenError("กิจกรรมนี้ปิดรับสมัครแล้ว");
        }

        // Verify student information belongs to user
        const studentInfo = await this.studentInformationService.getStudentInformation(user_id);
        if (studentInfo.id !== student_information_id) {
            throw new ForbiddenError("ข้อมูลนักเรียนไม่ถูกต้อง");
        }

        // Check if already registered
        const isRegistered = await this.activityUserService.isRegistered(student_information_id, activity_id);
        if (isRegistered) {
            throw new ConflictError("นักเรียนคนนี้ได้สมัครกิจกรรมนี้แล้ว");
        }

        const balance = await this.userService.getuserBalance(user_id);

        if (balance < activity.price) {
            throw new ForbiddenError("ยอดเงินไม่เพียงพอ");
        }

        await this.userService.setUserBalance(user_id, balance - activity.price);

        await this.activityUserService.join(student_information_id, activity_id);
    }

    async approveActivity(activity_id: string) {
        const activity = await this.activityRepository.getById(activity_id);

        if (!activity) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการอนุมัติ");

        if (activity.approved) throw new ConflictError("กิจกรรมนี้ถูกอนุมัติแล้ว");

        await this.activityRepository.approve(activity_id);
    }
}

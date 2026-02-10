import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/error";
import type { ActivityRepository, GetActivityType } from "./activities.repository";
import type { ActivitySchedulesRepository } from "./activity-schedules.repository";
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

export type CreateActivityWithFilesType = Omit<
    CreateActivityWithFilesDto,
    "attachments_metadata"
> & {
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
        private readonly activitySchedulesRepository: ActivitySchedulesRepository,
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

        // สร้าง activity
        await this.activityRepository.create({
            owner_id: owner.id,
            title: data.title,
            thumbnail_file_id: file_id,
            description: data.description,
            description_short: data.description_short,
            approved: false,
            registration_open_at: data.registration_open_at,
            registration_close_at: data.registration_close_at,
        });

        // ดึง activity ที่เพิ่งสร้าง
        const activities = await this.activityRepository.getByOwnerId(owner.id);
        const createdActivity = activities[activities.length - 1];

        if (!createdActivity) {
            throw new NotFoundError("Failed to create activity");
        }

        // สร้าง schedules
        await this.activitySchedulesRepository.createMany(
            createdActivity.id,
            data.schedules.map((s) => ({
                event_start_at: s.event_start_at,
                price: s.price,
                max_users: s.max_users,
            }))
        );
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
            approved: false,
            registration_open_at: data.registration_open_at,
            registration_close_at: data.registration_close_at,
        });

        // Get the created activity to get its ID
        const activities = await this.activityRepository.getByOwnerId(owner.id);
        const createdActivity = activities[activities.length - 1];

        if (!createdActivity) {
            throw new NotFoundError("Failed to create activity");
        }

        // Create schedules
        await this.activitySchedulesRepository.createMany(
            createdActivity.id,
            data.schedules.map((s) => ({
                event_start_at: s.event_start_at,
                price: s.price,
                max_users: s.max_users,
            }))
        );

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

    async getActivityDetail(id: string) {
        const activity = await this.activityRepository.getById(id);
        if (!activity) {
            throw new NotFoundError("Activity not found");
        }

        const thumbnail = await this.fileService.getFileById(activity.thumbnail_file_id);
        const attachments = await this.activityFilesService.getActivityFiles(id);
        const schedules = await this.activitySchedulesRepository.getByActivityId(id);

        const schedulesWithUsers = await Promise.all(
            schedules.map(async (schedule) => {
                const users = await this.activityUserService.getRegisteredUsersWithInfo(schedule.id);

                return {
                    ...schedule,
                    users_registered: users.length,
                    available_spots: Math.max(0, schedule.max_users - users.length),
                    registered_users: users,
                };
            })
        );

        const totalUsersRegistered = schedulesWithUsers.reduce(
            (sum, s) => sum + s.users_registered,
            0
        );
        const prices = schedules.map((s) => s.price);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

        return {
            ...activity,
            price_range: prices.length > 1 ? { min: minPrice, max: maxPrice } : undefined,
            price: prices.length === 1 ? prices[0] : undefined,
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
            schedules: schedulesWithUsers,
            users_registered: totalUsersRegistered,
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
                const schedules = await this.activitySchedulesRepository.getByActivityId(activity.id);

                // ดึงข้อมูล schedules พร้อม users ที่ลงทะเบียนในแต่ละรอบ
                const schedulesWithUsers = await Promise.all(
                    schedules.map(async (schedule) => {
                        const users = await this.activityUserService.getRegisteredUsersWithInfo(schedule.id);
                        return {
                            ...schedule,
                            users_registered: users.length,
                            registered_users: users,
                        };
                    })
                );

                // คำนวณจำนวนคนลงทะเบียนทั้งหมดและราคา
                const usersRegistered = schedulesWithUsers.reduce(
                    (sum, s) => sum + s.users_registered,
                    0
                );

                const prices = schedules.map((s) => s.price);
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

                return {
                    ...activity,
                    thumbnail_url: file.url,
                    users_registered: usersRegistered,
                    price_range: prices.length > 1 ? { min: minPrice, max: maxPrice } : undefined,
                    price: prices.length === 1 ? prices[0] : undefined,
                    next_event_start_at: schedules.length > 0
                        ? [...schedules].sort((a, b) => a.event_start_at.getTime() - b.event_start_at.getTime())[0]!.event_start_at
                        : undefined,
                    schedules: schedulesWithUsers,
                };
            })
        );

        return activitiesWithThumbnails;
    }

    async getPublishedActivities() {
        return await this.getAllActivities(() => this.activityRepository.getPublished());
    }

    async getUnpublishedActivities() {
        return await this.getAllActivities(() => this.activityRepository.getUnpublished());
    }

    async getActivitiesByOwner(ownerId: string) {
        const owner = await this.userService.getUserById(ownerId);

        if (!owner) throw new NotFoundError("Owner not found");

        return this.activityRepository.getByOwnerId(ownerId);
    }

    async joinActivity(
        user_id: string,
        activity_id: string,
        schedule_ids: string[],
        student_information_id: string,
        paymentFile?: { file: Buffer; filename: string; mimetype: string; size: number }
    ) {
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

        // Validate each schedule
        for (const schedule_id of schedule_ids) {
            const schedule = await this.activitySchedulesRepository.getById(schedule_id);
            if (!schedule || schedule.activity_id !== activity_id) {
                throw new NotFoundError("ไม่พบรอบที่ต้องการสมัคร");
            }

            if (now > schedule.event_start_at) {
                throw new ForbiddenError("รอบนี้เริ่มกิจกรรมไปแล้ว");
            }

            const isRegistered = await this.activityUserService.isRegistered(
                student_information_id,
                schedule_id
            );
            if (isRegistered) {
                throw new ConflictError("นักเรียนคนนี้ได้สมัครรอบนี้แล้ว");
            }

            const registeredCount = await this.activityUserService.getRegisteredCount(schedule_id);
            if (registeredCount >= schedule.max_users) {
                throw new ForbiddenError("รอบนี้เต็มแล้ว");
            }
        }

        // Upload payment slip if provided
        let payment_file_id: string | undefined;
        if (paymentFile) {
            payment_file_id = await this.fileService.createFile({
                file: paymentFile.file,
                key: paymentFile.filename,
                filename: paymentFile.filename,
                mimetype: paymentFile.mimetype,
                size: paymentFile.size,
            });
        }

        await this.activityUserService.joinMany(
            student_information_id,
            schedule_ids,
            payment_file_id
        );
    }

    async getActivityPendingRegistrations(activity_id: string) {
        const activity = await this.activityRepository.getById(activity_id);
        if (!activity) throw new NotFoundError("ไม่พบกิจกรรม");

        const schedules = await this.activitySchedulesRepository.getByActivityId(activity_id);
        const schedule_ids = schedules.map((s) => s.id);

        return this.activityUserService.getPendingByScheduleIds(schedule_ids);
    }

    async updateRegistrationStatus(registration_id: string, status: "approved" | "rejected") {
        const registration = await this.activityUserService.getById(registration_id);
        if (!registration) throw new NotFoundError("ไม่พบการลงทะเบียน");

        await this.activityUserService.updatePaymentStatus(registration_id, status);
    }

    async approveActivity(activity_id: string) {
        const activity = await this.activityRepository.getById(activity_id);

        if (!activity) throw new NotFoundError("ไม่พบกิจกรรมที่ต้องการอนุมัติ");

        if (activity.approved) throw new ConflictError("กิจกรรมนี้ถูกอนุมัติแล้ว");

        await this.activityRepository.approve(activity_id);
    }
}

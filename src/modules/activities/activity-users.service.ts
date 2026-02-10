import type { ActivityUsersRepository, PendingRegistration } from "./activity-users.repository";

export class ActivityUserService {
    constructor(private readonly activityUsersRepository: ActivityUsersRepository) {}

    async join(student_information_id: string, schedule_id: string, payment_file_id?: string): Promise<void> {
        await this.activityUsersRepository.join(student_information_id, schedule_id, payment_file_id);
    }

    async joinMany(student_information_id: string, schedule_ids: string[], payment_file_id?: string): Promise<void> {
        await this.activityUsersRepository.joinMany(student_information_id, schedule_ids, payment_file_id);
    }

    async leave(student_information_id: string, schedule_id: string): Promise<void> {
        await this.activityUsersRepository.leave(student_information_id, schedule_id);
    }

    async getRegisteredUsers(schedule_id: string) {
        return this.activityUsersRepository.getRegisteredUsers(schedule_id);
    }

    async getRegisteredUsersWithInfo(schedule_id: string) {
        return this.activityUsersRepository.getRegisteredUsersWithInfo(schedule_id);
    }

    async isRegistered(student_information_id: string, schedule_id: string): Promise<boolean> {
        return this.activityUsersRepository.isRegistered(student_information_id, schedule_id);
    }

    async getRegisteredCount(schedule_id: string): Promise<number> {
        return this.activityUsersRepository.getRegisteredCount(schedule_id);
    }

    async getById(id: string) {
        return this.activityUsersRepository.getById(id);
    }

    async updatePaymentStatus(id: string, status: "approved" | "rejected"): Promise<void> {
        return this.activityUsersRepository.updatePaymentStatus(id, status);
    }

    async getPendingByScheduleIds(schedule_ids: string[]): Promise<PendingRegistration[]> {
        return this.activityUsersRepository.getPendingByScheduleIds(schedule_ids);
    }
}

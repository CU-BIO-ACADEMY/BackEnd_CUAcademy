import type { ActivityUsersRepository } from "./activity-users.repository";

export class ActivityUserService {
    constructor(private readonly activityUsersRepository: ActivityUsersRepository) {}

    async join(student_information_id: string, schedule_id: string): Promise<void> {
        await this.activityUsersRepository.join(student_information_id, schedule_id);
    }

    async leave(student_information_id: string, schedule_id: string): Promise<void> {
        await this.activityUsersRepository.leave(student_information_id, schedule_id);
    }

    async getRegisteredUsers(schedule_id: string): Promise<string[]> {
        const users = await this.activityUsersRepository.getRegisteredUsers(schedule_id);

        return users.map((user) => user.student_information_id);
    }

    async isRegistered(student_information_id: string, schedule_id: string): Promise<boolean> {
        return this.activityUsersRepository.isRegistered(student_information_id, schedule_id);
    }

    async getRegisteredCount(schedule_id: string): Promise<number> {
        return this.activityUsersRepository.getRegisteredCount(schedule_id);
    }
}

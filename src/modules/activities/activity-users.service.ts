import type { ActivityUsersRepository } from "./activity-users.repository";

export class ActivityUserService {
    constructor(private readonly activityUsersRepository: ActivityUsersRepository) {}

    async join(student_information_id: string, activity_id: string): Promise<void> {
        await this.activityUsersRepository.join(student_information_id, activity_id);
    }

    async leave(student_information_id: string, activity_id: string): Promise<void> {
        await this.activityUsersRepository.leave(student_information_id, activity_id);
    }

    async getRegisteredUsers(activity_id: string): Promise<string[]> {
        const users = await this.activityUsersRepository.getRegisteredUsers(activity_id);

        return users.map((user) => user.student_information_id);
    }

    async isRegistered(student_information_id: string, activity_id: string): Promise<boolean> {
        return this.activityUsersRepository.isRegistered(student_information_id, activity_id);
    }
}

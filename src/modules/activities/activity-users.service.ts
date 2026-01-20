import type { ActivityUsersRepository } from "./activity-users.repository";

export class ActivityUserService {
    constructor(private readonly activityUsersRepository: ActivityUsersRepository) {}

    async join(user_id: string, activity_id: string): Promise<void> {
        await this.activityUsersRepository.join(user_id, activity_id);
    }

    async leave(user_id: string, activity_id: string): Promise<void> {
        await this.activityUsersRepository.leave(user_id, activity_id);
    }

    async getRegisteredUsers(activity_id: string): Promise<string[]> {
        const users = await this.activityUsersRepository.getRegisteredUsers(activity_id);

        return users.map((user) => user.user_id)
    }
}

import { v4 } from "uuid";
import type { SessionRepository } from "./session.repository";
import type { UserService } from "../user/user.service";

export class SessionService {
    constructor(
        private readonly sessionRepository: SessionRepository,
        private readonly userService: UserService
    ) {}

    get SESSION_TTL() {
        return 3 * 24 * 60 * 60 * 1000;
    }

    async create(user_id: string) {
        const id = v4();

        const expires = new Date(Date.now() + this.SESSION_TTL * 1000);

        await this.sessionRepository.create({
            id: id,
            user_id: user_id,
            expired_at: expires,
            created_at: new Date(),
        });

        return id;
    }

    async get(id: string) {
        return await this.sessionRepository.get(id);
    }

    async delete(id: string) {
        await this.sessionRepository.delete(id);
    }

    async isUserAdmin(user_id: string) {
        const { role } = await this.userService.getUserById(user_id);

        return role === "admin";
    }
}

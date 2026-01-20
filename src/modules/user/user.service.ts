import { v7 } from "uuid";
import type { UserRepository } from "./user.repository";
import { NotFoundError } from "../../lib/error";

export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async createUser(email: string, displayName: string, profileImageUrl?: string) {
        const id = v7();

        await this.userRepository.create({
            id: id,
            email: email,
            display_name: displayName,
            profile_image_url: profileImageUrl,
            balance: 0,
        });

        return id;
    }

    async getUserById(id: string) {
        const user = await this.userRepository.getUserById(id);

        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    async getUserByEmail(email: string) {
        return this.userRepository.getUserByEmail(email);
    }

    async updateProfile(
        userId: string,
        email: string,
        displayName: string,
        profileImageUrl?: string
    ) {
        await this.userRepository.updateProfile(userId, email, displayName, profileImageUrl);
    }

    async getuserBalance(id: string) {
        const { balance } = await this.getUserById(id);

        return balance;
    }

    async setUserBalance(id: string, balance: number) {
        await this.userRepository.setUserBalance(id, balance);
    }
}

import { NotFoundError, ConflictError, BadRequestError } from "../../lib/error";
import type { UserInterestsRepository } from "./user-interests.repository";
import type { TagService } from "../tags/tags.service";
import type { UserService } from "./user.service";
import type { InferSelectModel } from "drizzle-orm";
import type { tagsTable } from "../../lib/drizzle/schema";

export class UserInterestsService {
    constructor(
        private userInterestsRepository: UserInterestsRepository,
        private tagService: TagService,
        private userService: UserService
    ) {}

    async addInterest(userId: string, tagId: string): Promise<void> {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        await this.tagService.getTagById(tagId);

        const exists = await this.userInterestsRepository.hasInterest(userId, tagId);
        if (exists) {
            throw new ConflictError("User already has this interest");
        }

        await this.userInterestsRepository.add(userId, tagId);
    }

    async addMultipleInterests(userId: string, tagIds: string[]): Promise<void> {
        if (!tagIds || tagIds.length === 0) {
            throw new BadRequestError("Tag IDs are required");
        }

        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        for (const tagId of tagIds) {
            await this.tagService.getTagById(tagId);

            const exists = await this.userInterestsRepository.hasInterest(userId, tagId);
            if (!exists) {
                await this.userInterestsRepository.add(userId, tagId);
            }
        }
    }

    async removeInterest(userId: string, tagId: string): Promise<void> {
        const exists = await this.userInterestsRepository.hasInterest(userId, tagId);
        if (!exists) {
            throw new NotFoundError("User interest not found");
        }

        await this.userInterestsRepository.remove(userId, tagId);
    }

    async getUserInterestTags(userId: string): Promise<Array<InferSelectModel<typeof tagsTable>>> {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        return this.userInterestsRepository.getUserInterestTags(userId);
    }

    async removeAllInterests(userId: string): Promise<void> {
        const user = await this.userService.getUserById(userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        await this.userInterestsRepository.removeAllByUserId(userId);
    }
}

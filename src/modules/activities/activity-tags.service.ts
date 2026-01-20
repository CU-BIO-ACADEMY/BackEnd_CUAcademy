import { NotFoundError, ConflictError, BadRequestError } from "../../lib/error";
import type { ActivityTagsRepository } from "./activity-tags.repository";
import type { ActivitiesService } from "./activities.service";
import type { TagService } from "../tags/tags.service";
import type { InferSelectModel } from "drizzle-orm";
import type { tagsTable } from "../../lib/drizzle/schema";

export class ActivityTagsService {
    constructor(
        private activityTagsRepository: ActivityTagsRepository,
        private activitiesService: ActivitiesService,
        private tagService: TagService
    ) {}

    async addTag(activityId: string, tagId: string): Promise<void> {
        await this.activitiesService.getActivityById(activityId);

        await this.tagService.getTagById(tagId);

        const exists = await this.activityTagsRepository.hasTag(activityId, tagId);
        if (exists) {
            throw new ConflictError("Activity already has this tag");
        }

        await this.activityTagsRepository.add(activityId, tagId);
    }

    async addMultipleTags(activityId: string, tagIds: string[]): Promise<void> {
        if (!tagIds || tagIds.length === 0) {
            throw new BadRequestError("Tag IDs are required");
        }

        await this.activitiesService.getActivityById(activityId);

        for (const tagId of tagIds) {
            await this.tagService.getTagById(tagId);

            const exists = await this.activityTagsRepository.hasTag(activityId, tagId);
            if (!exists) {
                await this.activityTagsRepository.add(activityId, tagId);
            }
        }
    }

    async removeTag(activityId: string, tagId: string): Promise<void> {
        const exists = await this.activityTagsRepository.hasTag(activityId, tagId);
        if (!exists) {
            throw new NotFoundError("Activity tag not found");
        }

        await this.activityTagsRepository.remove(activityId, tagId);
    }

    async getActivityTags(activityId: string): Promise<Array<InferSelectModel<typeof tagsTable>>> {
        await this.activitiesService.getActivityById(activityId);

        return this.activityTagsRepository.getActivityTagDetails(activityId);
    }

    async removeAllTags(activityId: string): Promise<void> {
        await this.activitiesService.getActivityById(activityId);

        await this.activityTagsRepository.removeAllByActivityId(activityId);
    }
}

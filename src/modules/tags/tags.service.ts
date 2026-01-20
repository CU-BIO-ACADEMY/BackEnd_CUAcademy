import { NotFoundError } from "../../lib/error";
import type { TagRepository } from "./tags.repository";
import type { InferSelectModel } from "drizzle-orm";
import type { tagsTable } from "../../lib/drizzle/schema";

type GetTagType = InferSelectModel<typeof tagsTable> | undefined;

export class TagService {
    constructor(private readonly tagRepository: TagRepository) {}

    async createTag(name: string): Promise<void> {
        await this.tagRepository.create({ name });
    }

    async getAllTags(): Promise<GetTagType[]> {
        return this.tagRepository.get();
    }

    async getTagById(id: string): Promise<GetTagType> {
        const tag = await this.tagRepository.getTagById(id);
        if (!tag) {
            throw new NotFoundError("Tag not found");
        }
        return tag;
    }

    async getTagByName(name: string): Promise<GetTagType> {
        return this.tagRepository.getTagByName(name);
    }

    async deleteTag(id: string): Promise<void> {
        const tag = await this.tagRepository.getTagById(id);
        if (!tag) {
            throw new NotFoundError("Tag not found");
        }
        await this.tagRepository.delete(id);
    }
}

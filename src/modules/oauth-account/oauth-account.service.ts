import { v7 } from "uuid";
import type { OAuthAccountRepository } from "./oauth-account.repository";

export class OAuthAccountService {
    constructor(private readonly oauthAccountRepository: OAuthAccountRepository) {}

    async createOAuthAccount(userId: string, provider: string, providerAccountId: string) {
        await this.oauthAccountRepository.create({
            id: v7(),
            user_id: userId,
            provider,
            provider_account_id: providerAccountId,
        });
    }

    async getByProviderAccountId(provider: string, providerAccountId: string) {
        return this.oauthAccountRepository.getByProviderAccountId(provider, providerAccountId);
    }

    async getByUserId(userId: string) {
        return this.oauthAccountRepository.getByUserId(userId);
    }
}

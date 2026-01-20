import { env } from "../../config/env";
import { BadRequestError, NotFoundError } from "../../lib/error";
import { googleAuth } from "../../lib/google-auth";
import type { SessionService } from "../session/session.service";
import type { UserService } from "../user/user.service";
import type { OAuthAccountService } from "../oauth-account/oauth-account.service";

export class AuthService {
    constructor(
        private readonly sessionService: SessionService,
        private readonly userService: UserService,
        private readonly oauthAccountService: OAuthAccountService
    ) {}

    get COOKIE_NAME() {
        return "session_id";
    }

    get SESSION_TTL() {
        return this.sessionService.SESSION_TTL;
    }

    google() {
        const authUrl = googleAuth.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
            state: Math.random().toString(36).substring(7),
        });

        return authUrl;
    }

    async googleCallback(code: string) {
        const { tokens } = await googleAuth.getToken(code as string);
        googleAuth.setCredentials(tokens);

        const ticket = await googleAuth.verifyIdToken({
            idToken: tokens.id_token!,
            audience: env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) throw new NotFoundError("Failed to get user info");

        const googleId = payload.sub;
        const email = payload.email;
        const displayName = payload.name;
        const profileImageUrl = payload.picture;

        if (!googleId) throw new BadRequestError("Google ID is required");
        if (!email || !displayName) throw new BadRequestError("Email and name are required");

        const existingAccount = await this.oauthAccountService.getByProviderAccountId("google", googleId);

        let user_id: string;

        if (existingAccount) {
            user_id = existingAccount.user_id;
            await this.userService.updateProfile(user_id, email, displayName, profileImageUrl);
        } else {
            const existingUser = await this.userService.getUserByEmail(email);

            if (existingUser) {
                user_id = existingUser.id;
                await this.userService.updateProfile(user_id, email, displayName, profileImageUrl);
            } else {
                user_id = await this.userService.createUser(email, displayName, profileImageUrl);
            }

            await this.oauthAccountService.createOAuthAccount(user_id, "google", googleId);
        }

        const session_id = await this.sessionService.create(user_id);

        return session_id;
    }

    async getCurrentUser(user_id: string) {
        const user = await this.userService.getUserById(user_id);

        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    async logout(session_id: string) {
        await this.sessionService.delete(session_id);
    }
}

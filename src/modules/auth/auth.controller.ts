import type { Request, Response } from "express";
import type { AuthService } from "./auth.service";
import { handleError, NotFoundError } from "../../lib/error";
import { env } from "../../config/env";
import type { AuthenticatedRequest } from "../../types/express";

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    async google(req: Request, res: Response) {
        try {
            const authURL = this.authService.google();

            res.json({ url: authURL });
        } catch (error) {
            handleError(res, error);
        }
    }

    async googleCallback(req: Request, res: Response) {
        try {
            const { code } = req.query;

            if (!code) throw new NotFoundError("Authorization code not found");

            const session_id = await this.authService.googleCallback(code.toString());

            res.cookie(this.authService.COOKIE_NAME, session_id, {
                httpOnly: true,
                secure: true,
                path: "/",
                maxAge: this.authService.SESSION_TTL,
                sameSite: "lax",
            });

            res.redirect(`${env.FRONTEND_URL}`);
        } catch (error) {
            handleError(res, error);
        }
    }

    async getCurrentUser(req: AuthenticatedRequest, res: Response) {
        try {
            const user_id = req.session.user_id

            const user = await this.authService.getCurrentUser(user_id);

            res.status(200).json(user);
        } catch (error) {
            handleError(res, error);
        }
    }

    async logout(req: AuthenticatedRequest, res: Response) {
        try {
            const session_id = req.session.id

            if (!session_id) throw new NotFoundError("Session not found");

            await this.authService.logout(session_id);

            res.clearCookie(this.authService.COOKIE_NAME, {
                httpOnly: true,
                secure: true,
                path: "/",
                sameSite: "lax",
            });

            res.status(200).json({ message: "ออกจากระบบสำเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }
}

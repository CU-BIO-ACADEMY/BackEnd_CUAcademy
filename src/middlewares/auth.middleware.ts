import type { NextFunction, Request, Response } from "express";
import type { SessionService } from "../modules/session/session.service";
import { HTTP_STATUS } from "../lib/http-status";

export class AuthMiddleware {
    constructor(private readonly sessionService: SessionService) {}

    async session(req: Request, res: Response, next: NextFunction) {
        const sid = req.cookies.session_id;

        if (!sid) return next();

        const session = await this.sessionService.get(sid);

        if (!session) return next();

        req.session = session;

        next();
    }

    async requireAuth(req: Request, res: Response, next: NextFunction) {
        if (!req.session) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
            return;
        }

        next();
    }

    async requireAdmin(req: Request, res: Response, next: NextFunction) {
        if (!req.session) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: "Unauthorized" });
            return;
        }

        const isAdmin = await this.sessionService.isUserAdmin(req.session.user_id);

        if (!isAdmin) {
            res.status(HTTP_STATUS.FORBIDDEN).json({ message: "Forbidden" });
            return;
        }

        next();
    }
}

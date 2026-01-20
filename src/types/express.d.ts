import type { Request, RequestHandler } from "express";
import type { SessionType } from "../modules/session/session.repository";

declare global {
    namespace Express {
        interface Request {
            session?: SessionType;
        }
    }
}

export interface AuthenticatedRequest extends Request {
    session: SessionType;
}

export type AuthenticatedRequestHandler = RequestHandler;

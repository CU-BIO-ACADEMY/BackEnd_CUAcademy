import type { Response } from "express";
import z from "zod";
import { HTTP_STATUS } from "./http-status";

export class HttpError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
    }
}

export class BadRequestError extends HttpError {
    constructor(message: string) {
        super(message, HTTP_STATUS.BAD_REQUEST);
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message: string) {
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

export class ForbiddenError extends HttpError {
    constructor(message: string) {
        super(message, HTTP_STATUS.FORBIDDEN);
    }
}

export class NotFoundError extends HttpError {
    constructor(message: string) {
        super(message, HTTP_STATUS.NOT_FOUND);
    }
}

export class ConflictError extends HttpError {
    constructor(message: string) {
        super(message, HTTP_STATUS.CONFLICT);
    }
}

export const handleError = (res: Response, error: unknown) => {
    if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: error.issues[0]?.message
        });
    }

    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
            message: error.message
        });
    }

    console.log(error)

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
    });
};

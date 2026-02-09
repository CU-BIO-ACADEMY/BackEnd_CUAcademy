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

interface MulterError extends Error {
    code: string;
    field?: string;
}

const isMulterError = (error: unknown): error is MulterError => {
    return error instanceof Error && "code" in error && typeof (error as MulterError).code === "string";
};

const getMulterErrorMessage = (error: MulterError): string => {
    switch (error.code) {
        case "LIMIT_FILE_SIZE":
            return "ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 20MB)";
        case "LIMIT_FILE_COUNT":
            return "จำนวนไฟล์เกินขีดจำกัด";
        case "LIMIT_UNEXPECTED_FILE":
            return `ฟิลด์ไฟล์ '${error.field}' ไม่ถูกต้อง`;
        case "LIMIT_PART_COUNT":
            return "จำนวนส่วนของฟอร์มเกินขีดจำกัด";
        default:
            return "เกิดข้อผิดพลาดในการอัปโหลดไฟล์";
    }
};

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

    if (isMulterError(error)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            message: getMulterErrorMessage(error)
        });
    }

    console.log("Error:", error);
    if (error instanceof Error) {
        console.log("Error stack:", error.stack);
    }

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal server error",
    });
};

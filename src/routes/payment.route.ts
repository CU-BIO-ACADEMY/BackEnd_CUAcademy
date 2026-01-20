import { Router } from "express";
import { authMiddleware, paymentController } from "../lib/container";
import type { AuthenticatedRequestHandler } from "../types/express";
import { multerUpload } from "../lib/multer";

export const paymentRoute = Router().post(
    "/",
    multerUpload.single("qrcode"),
    authMiddleware.requireAuth.bind(authMiddleware),
    paymentController.create.bind(paymentController) as AuthenticatedRequestHandler
);

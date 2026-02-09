import { Router } from "express";
import { activityController, authMiddleware } from "../lib/container";
import type { AuthenticatedRequestHandler } from "../types/express";
import { multerUpload } from "../lib/multer";

export const activityRoute = Router()
    .get(
        "/",
        authMiddleware.requireAuth.bind(authMiddleware),
        activityController.getAllActivities.bind(activityController) as AuthenticatedRequestHandler
    )
    .post(
        "/",
        multerUpload.fields([
            { name: "thumbnail", maxCount: 1 },
            { name: "attachments", maxCount: 10 },
        ]),
        authMiddleware.requireAuth.bind(authMiddleware),
        activityController.create.bind(activityController) as AuthenticatedRequestHandler
    )
    .post(
        "/:id/join",
        authMiddleware.requireAuth.bind(authMiddleware),
        activityController.joinActivity.bind(activityController) as AuthenticatedRequestHandler
    )
    .post(
        "/:id/approve",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.approve.bind(activityController) as AuthenticatedRequestHandler
    )
    .get(
        "/unpublished",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.getUnpublishedActivities.bind(
            activityController
        ) as AuthenticatedRequestHandler
    );

import { Router } from "express";
import { activityController, authMiddleware } from "../lib/container";
import type { AuthenticatedRequestHandler } from "../types/express";
import { multerUpload, multerUploadImage } from "../lib/multer";

export const activityRoute = Router()
    .get(
        "/",
        authMiddleware.requireAuth.bind(authMiddleware),
        activityController.getAllActivities.bind(activityController) as AuthenticatedRequestHandler
    )
    .get(
        "/unpublished",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.getUnpublishedActivities.bind(
            activityController
        ) as AuthenticatedRequestHandler
    )
    .get(
        "/:id",
        authMiddleware.requireAuth.bind(authMiddleware),
        activityController.getActivity.bind(activityController) as AuthenticatedRequestHandler
    )
    .get(
        "/:id/registrations/pending",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.getPendingRegistrations.bind(activityController) as AuthenticatedRequestHandler
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
        multerUploadImage.single("slip"),
        authMiddleware.requireAuth.bind(authMiddleware),
        activityController.joinActivity.bind(activityController) as AuthenticatedRequestHandler
    )
    .post(
        "/:id/approve",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.approve.bind(activityController) as AuthenticatedRequestHandler
    )
    .patch(
        "/registrations/:registrationId/status",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.updateRegistrationStatus.bind(activityController) as AuthenticatedRequestHandler
    )
    .get(
        "/:id/email-template",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.getEmailTemplate.bind(activityController) as AuthenticatedRequestHandler
    )
    .put(
        "/:id/email-template",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.upsertEmailTemplate.bind(activityController) as AuthenticatedRequestHandler
    )
    .post(
        "/:id/send-emails",
        authMiddleware.requireAdmin.bind(authMiddleware),
        activityController.sendEmails.bind(activityController) as AuthenticatedRequestHandler
    );

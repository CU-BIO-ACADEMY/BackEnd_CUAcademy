import { Router } from "express";
import { authController, authMiddleware } from "../lib/container";
import type { AuthenticatedRequestHandler } from "../types/express";

export const authRoute = Router()
    .get("/google", authController.google.bind(authController))
    .get("/google/callback", authController.googleCallback.bind(authController))
    .get(
        "/me",
        authMiddleware.requireAuth.bind(authMiddleware),
        authController.getCurrentUser.bind(authController) as AuthenticatedRequestHandler
    )
    .post(
        "/logout",
        authMiddleware.requireAuth.bind(authMiddleware),
        authController.logout.bind(authController) as AuthenticatedRequestHandler
    );

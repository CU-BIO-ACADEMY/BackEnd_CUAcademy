import { Router } from "express";
import { studentInformationController, authMiddleware } from "../lib/container";
import type { AuthenticatedRequestHandler } from "../types/express";

export const studentInformationRoute = Router()
    .get(
        "/",
        authMiddleware.requireAuth.bind(authMiddleware),
        studentInformationController.get.bind(studentInformationController) as AuthenticatedRequestHandler
    )
    .get(
        "/all",
        authMiddleware.requireAuth.bind(authMiddleware),
        studentInformationController.getAll.bind(studentInformationController) as AuthenticatedRequestHandler
    )
    .post(
        "/",
        authMiddleware.requireAuth.bind(authMiddleware),
        studentInformationController.create.bind(studentInformationController) as AuthenticatedRequestHandler
    )
    .put(
        "/:id",
        authMiddleware.requireAuth.bind(authMiddleware),
        studentInformationController.update.bind(studentInformationController) as AuthenticatedRequestHandler
    )
    .delete(
        "/:id",
        authMiddleware.requireAuth.bind(authMiddleware),
        studentInformationController.delete.bind(studentInformationController) as AuthenticatedRequestHandler
    )
    .get(
        "/exists",
        authMiddleware.requireAuth.bind(authMiddleware),
        studentInformationController.checkExists.bind(studentInformationController) as AuthenticatedRequestHandler
    );

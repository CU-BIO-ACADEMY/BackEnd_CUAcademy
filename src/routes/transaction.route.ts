import { Router } from "express";
import { authMiddleware, transactionController } from "../lib/container";
import type { AuthenticatedRequestHandler } from "../types/express";

export const transactionRoute = Router().get(
    "/",
    authMiddleware.requireAuth.bind(authMiddleware),
    transactionController.getTransactions.bind(transactionController) as AuthenticatedRequestHandler
);

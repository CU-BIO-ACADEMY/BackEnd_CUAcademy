import { Router } from "express";
import { authMiddleware } from "../lib/container";

export const adminRoute = Router().use("/", authMiddleware.requireAdmin.bind(authMiddleware));

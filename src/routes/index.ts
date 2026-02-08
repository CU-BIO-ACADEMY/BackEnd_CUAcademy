import { Router } from "express";
import { authRoute } from "./auth.route";
import { paymentRoute } from "./payment.route";
import { activityRoute } from "./activity.route";
import { transactionRoute } from "./transaction.route";
import { studentInformationRoute } from "./student-information.route";

export const apiRoute = Router()
    .use("/activities", activityRoute)
    .use("/auth", authRoute)
    .use("/payment", paymentRoute)
    .use("/transactions", transactionRoute)
    .use("/student-information", studentInformationRoute);

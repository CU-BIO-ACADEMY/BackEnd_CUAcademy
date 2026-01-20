import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/express";
import type { PaymentService } from "./payment.service";
import { handleError, NotFoundError } from "../../lib/error";
import { v4 } from "uuid";

export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    async create(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.file) throw new NotFoundError("ไม่พบไฟล์ QR code");

            const ext = req.file.originalname.split(".").pop() || "";

            await this.paymentService.createPayment(
                req.session.user_id,
                req.file.buffer,
                `${v4()}.${ext}`
            );

            res.json({ message: "เติมเครดิตสําเร็จ" });
        } catch (error) {
            handleError(res, error);
        }
    }
}

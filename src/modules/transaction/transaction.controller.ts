import type { Response } from "express";
import type { AuthenticatedRequest } from "../../types/express";
import type { TransactionService } from "./transaction.service";
import { handleError } from "../../lib/error";

export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    async getTransactions(req: AuthenticatedRequest, res: Response) {
        try {
            const transactions = await this.transactionService.getTransactions(
                req.session.user_id,
                Number(req.query.limit) || 15,
                Number(req.query.offset) || 0
            );

            res.status(200).json(transactions);
        } catch (error) {
            handleError(res, error);
        }
    }
}

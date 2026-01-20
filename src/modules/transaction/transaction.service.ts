import { v4 } from "uuid";
import type { UserService } from "../user/user.service";
import type { TransactionRepository } from "./transaction.repository";

export class TransactionService {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly userService: UserService
    ) {}

    async despositTransaction(user_id: string, amount: number): Promise<string> {
        const user = await this.userService.getUserById(user_id);

        const transaction_id = v4();

        const newBalance = user.balance + amount;

        await this.transactionRepository.createTransaction({
            id: transaction_id,
            user_id: user_id,
            balance_before: user.balance,
            balance_after: newBalance,
            amount: amount,
            transaction_type: "topup",
        });

        await this.userService.setUserBalance(user_id, newBalance);

        return transaction_id;
    }

    async getTransactions(user_id: string, limit: number, offsets: number) {
        return this.transactionRepository.getTransactions(user_id, limit, offsets)
    }
}

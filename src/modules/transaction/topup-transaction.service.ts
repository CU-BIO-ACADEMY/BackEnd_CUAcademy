import type { TopupTransactionRepository } from "./topup-transaction.repository";

type createTopupTransactionType = {
    user_id: string;
    transaction_id: string;
    file_id: string;
    transaction_ref: string
    payload: string;
    amount: number;
};

export class TopupTransactionService {
    constructor(private readonly topupTransactionRepository: TopupTransactionRepository) {}

    async createTopupTransaction(data: createTopupTransactionType): Promise<void> {
        await this.topupTransactionRepository.createTopupTransaction({
            user_id: data.user_id,
            transaction_id: data.transaction_id,
            file_id: data.file_id,
            transaction_ref: data.transaction_ref,
            payload: data.payload,
            amount: data.amount,
        });
    }

    async isPayloadAlreadyExist(payload: string): Promise<boolean> {
        const exitse = await this.topupTransactionRepository.getTopupTransactionByPayload(payload);

        return !!exitse;
    }
}

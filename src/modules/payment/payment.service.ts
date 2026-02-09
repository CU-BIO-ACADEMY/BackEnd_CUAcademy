import { env } from "../../config/env";
import { ConflictError, ForbiddenError } from "../../lib/error";
import { readQRCode } from "../../lib/qr-code";
import type { FileService } from "../files/files.service";
import type { EasySlipService } from "../thrid-party/easy-slip/easy-slip.service";
import type { TopupTransactionService } from "../transaction/topup-transaction.service";
import type { TransactionService } from "../transaction/transaction.service";

export class PaymentService {
    private readonly expectedAccountNumber: string;

    constructor(
        private readonly easySlipService: EasySlipService,
        private readonly fileService: FileService,
        private readonly transactionService: TransactionService,
        private readonly topupTransactionService: TopupTransactionService
    ) {
        this.expectedAccountNumber = env.ACCOUNT_NUMBER;
    }

    async createPayment(user_id: string, file: Buffer, filename: string, mimetype: string, size: number) {
        const code = await readQRCode(file);

        const { data } = await this.easySlipService.verifyByPayload(code);

        const isSlipUsed = await this.topupTransactionService.isPayloadAlreadyExist(code);

        if (isSlipUsed) throw new ConflictError("สลิปนี้ถูกใช้ไปแล้ว");

        this.validateBankAccount(data.receiver.account.bank?.account!);

        const amount = data.amount.amount;

        const file_id = await this.fileService.createFile({
            key: filename,
            file: file,
            filename: filename,
            mimetype: mimetype,
            size: size,
        });

        const transaction_id = await this.transactionService.despositTransaction(user_id, amount);

        await this.topupTransactionService.createTopupTransaction({
            user_id: user_id,
            transaction_id: transaction_id,
            file_id: file_id,
            transaction_ref: data.transRef,
            payload: code,
            amount: amount,
        });
    }

    private validateBankAccount(accountNumber: string) {
        const visibleDigits = accountNumber.replace(/x/g, "").replace(/-/g, "");
        const expectedDigitsOnly = this.expectedAccountNumber.replace(/-/g, "");

        if (!expectedDigitsOnly.includes(visibleDigits))
            throw new ForbiddenError("เลขบัญชีผู้รับไม่ถูกต้อง");
    }
}

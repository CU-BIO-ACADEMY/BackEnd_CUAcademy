import { env } from "../../../config/env";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from "../../../lib/error";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export class ResendService {
    private readonly apiKey: string;
    private readonly fromEmail: string;

    constructor() {
        this.apiKey = env.RESEND_API_KEY;
        this.fromEmail = env.RESEND_FROM_EMAIL;
    }

    async sendEmail(params: SendEmailParams) {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: this.fromEmail,
                to: params.to,
                subject: params.subject,
                html: params.html,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            const message = `Resend: ${JSON.stringify(error)}`;

            switch (response.status) {
                case 400:
                    throw new BadRequestError(message);
                case 401:
                    throw new UnauthorizedError(message);
                case 403:
                    throw new ForbiddenError(message);
                case 404:
                    throw new NotFoundError(message);
                default:
                    throw new Error(message);
            }
        }

        return response.json();
    }

    async sendBatchEmails(emails: SendEmailParams[]) {
        const response = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                emails.map((email) => ({
                    from: this.fromEmail,
                    to: email.to,
                    subject: email.subject,
                    html: email.html,
                }))
            ),
        });

        if (!response.ok) {
            const error = await response.json();
            const message = `Resend: ${JSON.stringify(error)}`;

            switch (response.status) {
                case 400:
                    throw new BadRequestError(message);
                case 401:
                    throw new UnauthorizedError(message);
                case 403:
                    throw new ForbiddenError(message);
                case 404:
                    throw new NotFoundError(message);
                default:
                    throw new Error(message);
            }
        }

        return response.json();
    }
}

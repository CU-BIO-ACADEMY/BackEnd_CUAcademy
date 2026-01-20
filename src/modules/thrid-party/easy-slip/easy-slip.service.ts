import { env } from "../../../config/env";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from "../../../lib/error";
import type { EasySlipResponse } from "../../../types/third-party";

export class EasySlipService {
    private readonly apiKey: string;

    constructor() {
        this.apiKey = env.EASYSLIP_API_KEY;
    }

    async verifyByPayload(payload: string) {
        const url = `https://developer.easyslip.com/api/v1/verify?payload=${encodeURIComponent(payload)}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            const message = `EasySlip: ${JSON.stringify(error)}`;

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

        const result = (await response.json()) as EasySlipResponse;

        return result;
    }
}

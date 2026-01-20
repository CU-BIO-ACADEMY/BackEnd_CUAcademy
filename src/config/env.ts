import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    MINIO_ENDPOINT: z.string().min(1, "MINIO_ENDPOINT is required"),
    MINIO_PORT: z.string().transform((val) => parseInt(val, 10)),
    MINIO_USE_SSL: z
        .string()
        .optional()
        .transform((val) => val === "true"),
    MINIO_ACCESS_KEY: z.string().min(1, "MINIO_ACCESS_KEY is required"),
    MINIO_SECRET_KEY: z.string().min(1, "MINIO_SECRET_KEY is required"),

    GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
    GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
    GOOGLE_REDIRECT_URI: z.string().min(1, "GOOGLE_REDIRECT_URI is required"),

    FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),

    EASYSLIP_API_KEY: z.string().min(1, "EASYSLIP_API_KEY is required"),
    ACCOUNT_NUMBER: z.string().min(1, "ACCOUNT_NUMBER is required"),
});

const parseEnv = () => {
    try {
        const parsed = envSchema.parse(process.env);

        console.log("\n[ENV] ✓ Environment variables validated successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("[ENV] DATABASE_URL:", maskSensitive(parsed.DATABASE_URL));
        console.log("[ENV] MINIO_ENDPOINT:", parsed.MINIO_ENDPOINT);
        console.log("[ENV] MINIO_PORT:", parsed.MINIO_PORT);
        console.log("[ENV] MINIO_USE_SSL:", parsed.MINIO_USE_SSL);
        console.log("[ENV] MINIO_ACCESS_KEY:", maskSensitive(parsed.MINIO_ACCESS_KEY));
        console.log("[ENV] MINIO_SECRET_KEY:", maskSensitive(parsed.MINIO_SECRET_KEY));
        console.log("[ENV] GOOGLE_CLIENT_ID:", maskSensitive(parsed.GOOGLE_CLIENT_ID));
        console.log("[ENV] GOOGLE_CLIENT_SECRET:", maskSensitive(parsed.GOOGLE_CLIENT_SECRET));
        console.log("[ENV] GOOGLE_REDIRECT_URI:", parsed.GOOGLE_REDIRECT_URI);
        console.log("[ENV] FRONTEND_URL:", parsed.FRONTEND_URL);
        console.log("[ENV] EASYSLIP_API_KEY:", maskSensitive(parsed.EASYSLIP_API_KEY));
        console.log("[ENV] ACCOUNT_NUMBER:", maskSensitive(parsed.ACCOUNT_NUMBER));
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        return parsed;
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("\n[ENV] ✗ Environment validation failed:");
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            error.issues.forEach((err: z.ZodIssue) => {
                console.error(`[ENV] ${err.path.join(".")}: ${err.message}`);
            });
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        }
        throw error;
    }
};

function maskSensitive(value: string): string {
    if (value.length <= 8) {
        return "***";
    }
    return `${value.substring(0, 6)}...${value.substring(value.length - 6)}`;
}

export const env = parseEnv();

export type Env = typeof env;

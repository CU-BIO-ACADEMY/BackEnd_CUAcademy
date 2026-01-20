import { Client } from "minio";
import { env } from "../../config/env";

export const minioConfig = {
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
};

export const MINIO_BUCKET_NAME = "cu-academy";

export const minioClient = new Client(minioConfig);

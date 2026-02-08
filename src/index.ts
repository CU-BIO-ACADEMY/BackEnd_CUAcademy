import express from "express";
import cookies from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { apiRoute } from "./routes";
import { authMiddleware } from "./lib/container";

const app = express();

app.set("trust proxy", true);

const allowedOrigins = ["http://localhost:3000"];

app.use(morgan("combined"));
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, origin || true);
            } else {
                callback(null, false);
            }
        },
        credentials: true,
    })
);

app.use(
    express.urlencoded({
        extended: true,
        type: (req) => {
            const contentType = req.headers["content-type"] || "";
            return contentType.includes("application/x-www-form-urlencoded");
        },
    })
);
app.use(
    express.json({
        type: (req) => {
            const contentType = req.headers["content-type"] || "";
            return contentType.includes("application/json");
        },
    })
);
app.use(cookies());
app.use(authMiddleware.session.bind(authMiddleware));
app.use("/api", apiRoute);

const server = app.listen(8000, () => console.log("SERVER IS RUNNING ON PORT 8000"));

const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
        console.log("[Server] HTTP server closed");

        console.log("[Server] Graceful shutdown completed");
        process.exit(0);
    });

    setTimeout(() => {
        console.error("[Server] Forced shutdown after timeout");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

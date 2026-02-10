# Stage 1: Install dependencies & compile binary
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

# Stage 2: Minimal runtime (standalone binary, no Bun needed)
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash appuser
USER appuser

WORKDIR /app

COPY --from=builder /app/cu-backend ./cu-backend

EXPOSE 8000

CMD ["./cu-backend"]

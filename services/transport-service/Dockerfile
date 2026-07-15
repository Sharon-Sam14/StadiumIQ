FROM node:20-bookworm-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy monorepo settings
COPY package.json package-lock.json* turbo.json ./
COPY packages/tsconfig/ ./packages/tsconfig/
COPY packages/eslint-config/ ./packages/eslint-config/
COPY services/transport-service/ ./services/transport-service/

# Install and compile service
RUN npm install
RUN npx turbo run build --filter=@stadiumiq/transport-service

FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/services/transport-service/dist ./services/transport-service/dist
COPY --from=builder --chown=node:node /app/services/transport-service/package.json ./services/transport-service/package.json

USER node
EXPOSE 3003
ENV NODE_ENV=production
CMD ["node", "services/transport-service/dist/server.js"]

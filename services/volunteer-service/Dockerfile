FROM node:20-bookworm-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy monorepo configurations
COPY package.json package-lock.json* turbo.json ./
COPY packages/tsconfig/ ./packages/tsconfig/
COPY packages/eslint-config/ ./packages/eslint-config/
COPY packages/database/ ./packages/database/
COPY services/volunteer-service/ ./services/volunteer-service/

# Install and build database package first, then compile service
RUN npm install
RUN npx turbo run build --filter=@stadiumiq/database
RUN npx turbo run build --filter=@stadiumiq/volunteer-service

FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=node:node /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=node:node /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=node:node /app/services/volunteer-service/dist ./services/volunteer-service/dist
COPY --from=builder --chown=node:node /app/services/volunteer-service/package.json ./services/volunteer-service/package.json

USER node
EXPOSE 3002
ENV NODE_ENV=production
CMD ["node", "services/volunteer-service/dist/server.js"]

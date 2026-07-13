FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo settings and package configs
COPY package.json package-lock.json* turbo.json ./
COPY packages/tsconfig/ ./packages/tsconfig/
COPY packages/eslint-config/ ./packages/eslint-config/
COPY packages/database/ ./packages/database/
COPY services/fan-service/ ./services/fan-service/

# Install and build database package first to emit typings, then build service
RUN npm install
RUN npx turbo run build --filter=@stadiumiq/database
RUN npx turbo run build --filter=@stadiumiq/fan-service

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/services/fan-service/dist ./services/fan-service/dist
COPY --from=builder /app/services/fan-service/package.json ./services/fan-service/package.json

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "services/fan-service/dist/app.js"]

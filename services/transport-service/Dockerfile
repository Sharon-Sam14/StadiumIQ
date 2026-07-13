FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo settings
COPY package.json package-lock.json* turbo.json ./
COPY packages/tsconfig/ ./packages/tsconfig/
COPY packages/eslint-config/ ./packages/eslint-config/
COPY services/transport-service/ ./services/transport-service/

# Install and compile service
RUN npm install
RUN npx turbo run build --filter=@stadiumiq/transport-service

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/transport-service/dist ./services/transport-service/dist
COPY --from=builder /app/services/transport-service/package.json ./services/transport-service/package.json

EXPOSE 3003
ENV NODE_ENV=production
CMD ["node", "services/transport-service/dist/app.js"]

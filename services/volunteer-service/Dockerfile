FROM node:20-alpine AS builder
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

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/services/volunteer-service/dist ./services/volunteer-service/dist
COPY --from=builder /app/services/volunteer-service/package.json ./services/volunteer-service/package.json

EXPOSE 3002
ENV NODE_ENV=production
CMD ["node", "services/volunteer-service/dist/app.js"]

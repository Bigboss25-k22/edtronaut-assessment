# Multi-stage Dockerfile for EdTronaut Assessment
# Supports both API server and Worker process

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma (Alpine 3.19+ uses openssl3 by default, but also provides openssl)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma engine runtime
RUN apk add --no-cache openssl

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy OpenAPI docs (required for Swagger UI)
COPY --from=builder /app/src/api/docs ./dist/api/docs

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose API port (only needed for API container)
EXPOSE 3000

# Default command (can be overridden in docker-compose)
CMD ["node", "dist/index.js"]

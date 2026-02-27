# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application and verify output
RUN npm run build && \
    echo "=== Build completed. Contents of dist folder ===" && \
    ls -la dist/ && \
    echo "=== Contents of dist/src ===" && \
    ls -la dist/src/ && \
    echo "=== Verifying main.js exists ===" && \
    test -f dist/src/main.js || (echo "ERROR: dist/src/main.js not found!" && exit 1) && \
    echo "=== Contents of prisma folder ===" && \
    ls -la prisma/

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nestjs

# Copy package files
COPY package*.json ./

# Install production dependencies plus prisma for migrations
RUN npm ci --only=production && \
    npm install -g prisma && \
    npm cache clean --force

# Copy Prisma files (schema, migrations, and seed)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy entrypoint script (strip Windows CRLF line endings to ensure Linux compatibility)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3001

# Health check (longer start period for migrations)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

# Use entrypoint to run migrations before starting app
ENTRYPOINT ["/docker-entrypoint.sh"]

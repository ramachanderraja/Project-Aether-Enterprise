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

# Verify data files are in build context
RUN echo "=== CSV/XLSX data files in build context ===" && \
    ls -la data/ && \
    test -d data || (echo "ERROR: data/ directory not found in build context!" && exit 1)

# Generate Prisma client
RUN npx prisma generate

# Build application and verify output
RUN npm run build && \
    echo "=== Build completed ===" && \
    test -f dist/src/main.js || (echo "ERROR: dist/src/main.js not found!" && exit 1)

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

# Install production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy Prisma client (needed by NestJS module resolution)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy data files (CSV/XLSX for in-memory data loading)
COPY --from=builder /app/data ./data

# Verify data files exist in production image
RUN echo "=== Data files in production image ===" && \
    ls -la data/ && \
    echo "=== File count: $(ls data/ | wc -l) ==="

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3001/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]

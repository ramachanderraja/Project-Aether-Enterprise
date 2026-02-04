#!/bin/sh
set -e

echo "Starting Aether Backend..."
echo "DATABASE_URL is set: $(test -n "$DATABASE_URL" && echo 'yes' || echo 'no')"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy 2>&1 || echo "Migration warning - may already be applied"

# Run database seed (using pure JS version that doesn't need ts-node)
echo "Running database seed..."
node /app/prisma/seed.js 2>&1 || echo "Seed warning - may already be applied or users exist"

# Start the application
echo "Starting Node.js application..."
exec node dist/src/main

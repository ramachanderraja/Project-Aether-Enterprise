#!/bin/sh
set -e

echo "Starting Aether Backend (CSV-based mode)..."

# Start the application
echo "Starting Node.js application..."
exec node dist/src/main

#!/bin/bash

# Toolgate - Start all services for development

echo "🚀 Starting Toolgate services..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping all services..."
    jobs -p | xargs -r kill
    exit
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start Collector (port 8785)
echo "📊 Starting Collector on port 8785..."
cd apps/collector && pnpm dev &
COLLECTOR_PID=$!

# Wait a bit for collector to start
sleep 2

# Start Sanitizer (port 8786)
echo "🧹 Starting Sanitizer on port 8786..."
cd ../sanitizer && pnpm dev &
SANITIZER_PID=$!

# Wait a bit for sanitizer to start
sleep 2

# Start Gateway (port 8787)
echo "🚪 Starting Gateway on port 8787..."
cd ../gateway && pnpm dev &
GATEWAY_PID=$!

# Wait a bit for gateway to start
sleep 2

# Start Web UI (port 3000)
echo "🌐 Starting Web UI on port 3000..."
cd ../web && pnpm dev &
WEB_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Collector:  http://localhost:8785"
echo "🧹 Sanitizer:  http://localhost:8786"
echo "🚪 Gateway:    http://localhost:8787"
echo "🌐 Web UI:     http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait

#!/bin/bash

echo "🚀 Starting local deployment..."

# Stop and remove containers
echo "📥 Cleaning up..."
docker compose down

# Clean up images
echo "🧹 Removing old images..."
docker image prune -f

# Build and start services
echo "🏗️ Building and starting services..."
docker compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database setup
echo "🔄 Setting up database..."
docker compose exec backend rails db:create db:migrate db:seed

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🛠️ Backend API: http://localhost:3001"
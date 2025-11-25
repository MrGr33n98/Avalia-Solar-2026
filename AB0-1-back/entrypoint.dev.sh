#!/bin/bash
set -e

echo "🚀 Starting AB0-1 Development Environment..."

# Remove a potentially pre-existing server.pid for Rails
if [ -f tmp/pids/server.pid ]; then
  echo "🧹 Removing old server.pid..."
  rm tmp/pids/server.pid
fi

# Wait for database to be ready
echo "⏳ Waiting for database..."
until pg_isready -h db -U postgres; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until redis-cli -h redis ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Setup database if needed
if ! bundle exec rails db:version > /dev/null 2>&1; then
  echo "🗄️  Creating database..."
  bundle exec rails db:create
  
  echo "🔄 Running migrations..."
  bundle exec rails db:migrate
  
  echo "🌱 Loading seed data..."
  bundle exec rails db:seed
else
  echo "✅ Database already exists"
  
  # Check for pending migrations
  if bundle exec rails db:migrate:status | grep -q "down"; then
    echo "🔄 Running pending migrations..."
    bundle exec rails db:migrate
  else
    echo "✅ No pending migrations"
  fi
fi

# Precompile assets in development (optional, comment out if not needed)
# echo "🎨 Precompiling assets..."
# bundle exec rails assets:precompile

echo "🎉 Application is ready!"
echo "📝 Logs will appear below..."
echo "================================"

# Execute the main command
exec "$@"

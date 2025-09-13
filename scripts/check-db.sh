#!/bin/bash

# Toolgate - Check database connection

echo "🔍 Checking database connection..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL in your .env.local file"
    exit 1
fi

echo "📊 Testing database connection..."
echo "DATABASE_URL: ${DATABASE_URL:0:20}..."

# Test connection with psql
if command -v psql &> /dev/null; then
    if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo "✅ Database connection successful"
        
        # Check if tables exist
        echo "🔍 Checking if tables exist..."
        TABLES=$(psql "$DATABASE_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
        
        if echo "$TABLES" | grep -q "events"; then
            echo "✅ 'events' table exists"
        else
            echo "❌ 'events' table not found"
            echo "Run: psql \$DATABASE_URL -f md/day2/Supabase-Schema.sql"
        fi
        
        if echo "$TABLES" | grep -q "approvals"; then
            echo "✅ 'approvals' table exists"
        else
            echo "❌ 'approvals' table not found"
            echo "Run: psql \$DATABASE_URL -f md/day2/Supabase-Schema.sql"
        fi
    else
        echo "❌ Database connection failed"
        exit 1
    fi
else
    echo "⚠️  psql not found, skipping database check"
    echo "Make sure your DATABASE_URL is correct and accessible"
fi

echo ""
echo "📝 Next steps:"
echo "1. If tables don't exist, run: psql \$DATABASE_URL -f md/day2/Supabase-Schema.sql"
echo "2. Start services with: pnpm dev"
echo "3. Test services with: pnpm test:services"

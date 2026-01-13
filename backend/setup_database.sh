#!/bin/bash
# Setup database for BnB SmartChoice DSS

echo "=========================================="
echo "BnB SmartChoice DSS - Database Setup"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .env file not found. Using default values..."
    export DB_NAME=stayhub
    export DB_USER=stayhub_user
    export DB_PASSWORD=stayhub_password
    export DB_HOST=localhost
    export DB_PORT=5432
fi

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Function to execute SQL file
execute_sql() {
    local file=$1
    echo "📝 Executing: $file"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $file
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Success!"
    else
        echo "   ❌ Failed!"
        exit 1
    fi
}

# Check if database exists, if not, instructions to create
echo "🔍 Checking database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database!"
    echo ""
    echo "Please ensure PostgreSQL is running and create database:"
    echo "   docker-compose up -d"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c 'CREATE DATABASE $DB_NAME;'"
    exit 1
fi

echo "✅ Database connection successful!"
echo ""

# Execute schema
echo "1️⃣  Creating database schema..."
execute_sql "sql/01_schema.sql"
echo ""

# Execute seed data
echo "2️⃣  Inserting seed data (criteria & influence diagram)..."
execute_sql "sql/02_seed_data.sql"
echo ""

echo "=========================================="
echo "✅ Database setup completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Import listings: python3 src/import_listings.py"
echo "  2. Start API server: uvicorn src.api.main:app --reload"
echo ""


.PHONY: help install db-up db-down db-setup import-data run test clean

help:
	@echo "BnB SmartChoice DSS - Available Commands"
	@echo "========================================="
	@echo "make install      - Install Python dependencies"
	@echo "make db-up        - Start PostgreSQL container"
	@echo "make db-down      - Stop PostgreSQL container"
	@echo "make db-setup     - Setup database schema and seed data"
	@echo "make import-data  - Import listings from CSV"
	@echo "make run          - Start API server"
	@echo "make dev          - Start API in development mode"
	@echo "make test         - Run tests with pytest"
	@echo "make test-manual  - Run manual test script"
	@echo "make clean        - Clean up temporary files"

install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt

db-up:
	@echo "🚀 Starting PostgreSQL..."
	docker-compose up -d
	@echo "⏳ Waiting for database to be ready..."
	sleep 3
	@echo "✅ PostgreSQL is running"

db-down:
	@echo "🛑 Stopping PostgreSQL..."
	docker-compose down

db-reset:
	@echo "⚠️  Resetting database (all data will be lost)..."
	docker-compose down -v
	docker-compose up -d
	sleep 3
	@echo "✅ Database reset complete"

db-setup: db-up
	@echo "🔧 Setting up database..."
	chmod +x setup_database.sh
	./setup_database.sh

import-data:
	@echo "📥 Importing listings data..."
	python3 src/import_listings.py

run:
	@echo "🚀 Starting API server..."
	uvicorn src.api.main:app --host 0.0.0.0 --port 8000

dev:
	@echo "🔧 Starting API in development mode..."
	uvicorn src.api.main:app --reload --port 8000

test:
	@echo "🧪 Running tests with pytest..."
	pytest -v test_api.py

test-manual:
	@echo "🧪 Running manual test script..."
	python3 test_api.py

test-engines:
	@echo "🧪 Testing Influence Engine..."
	python3 src/services/influence_engine.py
	@echo ""
	@echo "🧪 Testing TOPSIS Engine..."
	python3 src/services/topsis_engine.py

clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	@echo "✅ Cleanup complete"

# Quick start: setup everything
setup-all: install db-setup import-data
	@echo ""
	@echo "✅ Setup complete!"
	@echo "Run 'make dev' to start the API server"

# Full restart
restart: db-reset db-setup import-data
	@echo ""
	@echo "✅ Full restart complete!"
	@echo "Run 'make dev' to start the API server"


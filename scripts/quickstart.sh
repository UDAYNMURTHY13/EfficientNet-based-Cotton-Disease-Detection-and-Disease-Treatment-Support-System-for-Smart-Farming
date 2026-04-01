#!/bin/bash
# CottonCare AI - Quick Start Script
# This script sets up and starts the application

set -e

echo "=========================================="
echo "CottonCare AI - Quick Start Setup"
echo "=========================================="
echo ""

# Check Docker and Docker Compose
echo "[1/5] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker and Docker Compose are installed"
echo ""

# Create .env file if not exists
echo "[2/5] Setting up environment..."
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    
    # Generate strong secret key
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    sed -i "s/your-super-secret-key-change-this-in-production-use-strong-random-key/$SECRET_KEY/" .env
    
    echo "✓ .env file created with generated secret key"
else
    echo "✓ .env file already exists"
fi
echo ""

# Create necessary directories
echo "[3/5] Creating directories..."
mkdir -p uploads logs models
echo "✓ Directories created"
echo ""

# Build Docker images
echo "[4/5] Building Docker images..."
docker-compose build --quiet
echo "✓ Docker images built successfully"
echo ""

# Start services
echo "[5/5] Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "Waiting for services to start..."
sleep 10

# Check health
if curl -f http://localhost:8001/health > /dev/null 2>&1; then
    echo ""
    echo "=========================================="
    echo "✓ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Services running on:"
    echo "  - API Backend: http://localhost:8001"
    echo "  - API Docs: http://localhost:8001/docs"
    echo "  - API ReDoc: http://localhost:8001/redoc"
    echo "  - Web Dashboard: http://localhost:3000"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "Stop services:"
    echo "  docker-compose down"
    echo ""
else
    echo "⚠ Health check failed. Services may still be starting."
    echo "Wait a few more seconds and check again:"
    echo "  curl http://localhost:8001/health"
fi

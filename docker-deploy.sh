#!/bin/bash

# Docker deployment script for PitchAI
# Run with: ./docker-deploy.sh

set -e

echo "🐳 Starting Docker deployment for PitchAI..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Installing Docker...${NC}"
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠️  Please log out and log back in for Docker group changes to take effect${NC}"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    cp .env.example .env
    echo -e "${RED}❌ Please update the .env file with your actual values before continuing${NC}"
    exit 1
fi

# Build and start services
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose build

echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 30

# Check service status
echo -e "${YELLOW}📊 Checking service status...${NC}"
docker-compose ps

# Show logs
echo -e "${YELLOW}📝 Recent logs:${NC}"
docker-compose logs --tail=20

echo -e "${GREEN}🎉 Deployment completed!${NC}"
echo -e "${YELLOW}📝 Access your application at:${NC}"
echo "   Frontend: http://47.111.157.35"
echo "   Backend API: http://47.111.157.35:8000/docs"

echo -e "${YELLOW}📝 Useful commands:${NC}"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update and restart: docker-compose up -d --build"
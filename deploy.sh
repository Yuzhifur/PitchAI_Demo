#!/bin/bash

# PitchAI Deployment Script for Ubuntu Server
# Run with: ./deploy.sh

set -e

echo "🚀 Starting PitchAI deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}❌ Please don't run this script as root${NC}"
    exit 1
fi

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install required system packages
echo -e "${YELLOW}🔧 Installing system dependencies...${NC}"
sudo apt install -y curl git nginx python3 python3-pip python3-venv nodejs npm supervisor

# Install specific Node.js version (18.x)
echo -e "${YELLOW}📥 Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create application directory
APP_DIR="/opt/pitchai"
echo -e "${YELLOW}📁 Creating application directory: $APP_DIR${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files
echo -e "${YELLOW}📋 Copying application files...${NC}"
cp -r . $APP_DIR/
cd $APP_DIR

# Note: Using Supabase instead of local PostgreSQL
echo -e "${YELLOW}🗄️  Skipping PostgreSQL setup - using Supabase...${NC}"

# Backend setup
echo -e "${YELLOW}🐍 Setting up Python backend...${NC}"
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create backend environment file
cat > .env << EOF
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
JWT_SECRET_KEY=your_jwt_secret_key_here_should_be_long_and_random
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
APP_ENV=production
DEBUG=False
API_PREFIX=/api/v1
PORT=8000
EOF

echo -e "${GREEN}✅ Backend environment file created at backend/.env${NC}"
echo -e "${YELLOW}⚠️  Please update the environment variables in backend/.env${NC}"

# Frontend setup
echo -e "${YELLOW}⚛️  Setting up Next.js frontend...${NC}"
cd $APP_DIR/frontend
npm install
npm run build

# Create frontend environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
EOF

echo -e "${GREEN}✅ Frontend environment file created at frontend/.env.local${NC}"

echo -e "${GREEN}🎉 Deployment preparation completed!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update environment variables in backend/.env"
echo "2. Configure Nginx (see nginx.conf)"
echo "3. Set up Supervisor for process management"
echo "4. Start the services"
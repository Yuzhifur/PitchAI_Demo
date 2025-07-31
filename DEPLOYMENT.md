# PitchAI Server Deployment Guide

This guide provides step-by-step instructions for deploying PitchAI to your Ubuntu server at `47.111.157.35`.

## Prerequisites

- Ubuntu server with sudo access
- Domain or IP address: `47.111.157.35`
- Server credentials (username/password)

## Deployment Options

### Option 1: Docker Deployment (Recommended)

Docker deployment provides isolation, easy management, and consistent environments.

#### Steps:

1. **Connect to your server:**
   ```bash
   ssh username@47.111.157.35
   ```

2. **Upload the project files:**
   ```bash
   # From your local machine
   scp -r /path/to/PitchAI_Demo username@47.111.157.35:/opt/
   ```

3. **Set up environment variables:**
   ```bash
   cd /opt/PitchAI_Demo
   cp .env.example .env
   nano .env  # Edit with your actual values
   ```

4. **Run the Docker deployment script:**
   ```bash
   chmod +x docker-deploy.sh
   ./docker-deploy.sh
   ```

5. **Access your application:**
   - Frontend: http://47.111.157.35
   - API Documentation: http://47.111.157.35:8000/docs

### Option 2: Traditional Deployment

Traditional deployment with Nginx, Supervisor, and PostgreSQL.

#### Steps:

1. **Connect to your server:**
   ```bash
   ssh username@47.111.157.35
   ```

2. **Upload and run deployment script:**
   ```bash
   # Upload project files
   scp -r /path/to/PitchAI_Demo username@47.111.157.35:/tmp/
   
   cd /tmp/PitchAI_Demo
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Configure environment variables:**
   ```bash
   # Edit backend environment
   nano /opt/pitchai/backend/.env
   
   # Edit frontend environment
   nano /opt/pitchai/frontend/.env.local
   ```

4. **Set up Nginx:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/pitchai
   sudo ln -s /etc/nginx/sites-available/pitchai /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Set up Supervisor:**
   ```bash
   sudo cp supervisor.conf /etc/supervisor/conf.d/pitchai.conf
   sudo supervisorctl reread
   sudo supervisorctl update
   sudo supervisorctl start pitchai:*
   ```

## Environment Variables

### Backend (.env)
```env
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
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://47.111.157.35:8000/api/v1
```

## Required API Keys

1. **Supabase Configuration:**
   - Visit your Supabase project dashboard
   - Get Project URL from Settings > API
   - Get anon/public key from Settings > API
   - Add to `SUPABASE_URL` and `SUPABASE_KEY`

2. **DeepSeek API Key:**
   - Visit: https://platform.deepseek.com/
   - Create account and generate API key
   - Add to `DEEPSEEK_API_KEY` in environment variables

3. **JWT Secret Key:**
   - Generate a random secret key for JWT tokens
   - Use: `openssl rand -hex 32`
   - Add to `JWT_SECRET_KEY`

## Database Setup

This deployment uses **Supabase** as the database:
- No local PostgreSQL installation required
- Database migrations are already applied in your Supabase project
- Connection is handled via Supabase client libraries

## File Structure After Deployment

```
/opt/pitchai/
├── backend/
│   ├── app/
│   ├── venv/
│   ├── uploads/
│   └── .env
├── frontend/
│   ├── .next/
│   └── .env.local
└── logs/
```

## Service Management

### Docker Deployment
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update and rebuild
docker-compose up -d --build
```

### Traditional Deployment
```bash
# Check service status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart pitchai:*

# View logs
sudo tail -f /var/log/pitchai-backend.log
sudo tail -f /var/log/pitchai-frontend.log
```

## Troubleshooting

### Common Issues

1. **Port 80 already in use:**
   ```bash
   sudo lsof -i :80
   sudo systemctl stop apache2  # If Apache is running
   ```

2. **Supabase connection issues:**
   - Check SUPABASE_URL and SUPABASE_KEY in .env
   - Verify Supabase project is active
   - Test connection from Supabase dashboard

3. **Permission issues:**
   ```bash
   sudo chown -R www-data:www-data /opt/pitchai
   sudo chmod -R 755 /opt/pitchai
   ```

4. **Nginx configuration test:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### Log Locations

- **Docker logs:** `docker-compose logs`
- **Nginx logs:** `/var/log/nginx/error.log`
- **Supervisor logs:** `/var/log/pitchai-*.log`
- **System logs:** `journalctl -u nginx`

## Security Considerations

1. **Firewall setup:**
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS (future)
   sudo ufw enable
   ```

2. **SSL Certificate (Optional):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Supabase security:**
   - Use Row Level Security (RLS) policies
   - Rotate API keys regularly
   - Monitor usage in Supabase dashboard

## Monitoring

### Health Checks
- Frontend: http://47.111.157.35
- Backend API: http://47.111.157.35:8000/docs
- Database: Check Supabase dashboard for connection status

### Performance Monitoring
```bash
# System resources
htop
df -h
free -h

# Service status
sudo systemctl status nginx
```

## Backup Strategy

### Database Backup
Supabase provides automatic backups:
- Daily backups are available in your Supabase dashboard
- Point-in-time recovery available for paid plans
- Manual backup: Use Supabase CLI or dashboard export

### Application Backup
```bash
# Backup uploads and configuration
tar -czf pitchai_backup_$(date +%Y%m%d).tar.gz /opt/pitchai/backend/uploads /opt/pitchai/backend/.env /opt/pitchai/frontend/.env.local
```

## Support

For deployment issues:
1. Check logs first
2. Verify environment variables (especially Supabase keys)
3. Test Supabase connection
4. Check network connectivity
5. Review file permissions

Remember to update DNS records if using a domain name instead of IP address.
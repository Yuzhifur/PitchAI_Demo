# Deployment Guide

## Frontend Deployment Options

### Option 1: Vercel (Recommended - Full Functionality)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL (e.g., `https://your-app.railway.app/api/v1`)
   - `NEXT_PUBLIC_APP_MODE`: `production`

4. **Features Available:**
   - ✅ Complete application functionality
   - ✅ Dynamic routes (`/projects/[id]`, `/projects/[id]/report`)
   - ✅ Project detail pages
   - ✅ Report generation
   - ✅ File uploads
   - ✅ All CRUD operations

### Option 2: Netlify (Alternative - Full Functionality)

1. **Build and Deploy:**
   ```bash
   cd frontend
   npm run build
   # Upload dist/ folder to Netlify or connect GitHub repo
   ```

2. **Configure Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL
   - `NEXT_PUBLIC_APP_MODE`: `production`

### Option 3: GitHub Pages (Limited Functionality)

⚠️ **Limitations**: Dynamic routes are disabled for static export compatibility.

**Features Available:**
- ✅ Dashboard
- ✅ Project listing
- ✅ New project creation
- ✅ Login/Authentication
- ✅ History page

**Features NOT Available:**
- ❌ Project detail pages (`/projects/[id]`)
- ❌ Report generation (`/projects/[id]/report`)
- ❌ Individual project management

**Current GitHub Actions Setup:**
- Automatically deploys on push to `main` branch
- Uses conditional static export (`NEXT_EXPORT=true`)
- Temporarily disables dynamic routes during build

## Backend (Railway)

Your backend is already successfully deployed on Railway with:
- FastAPI application
- PostgreSQL database
- File upload capabilities
- Full API functionality

## Recommendation

For production use with full functionality, deploy the frontend to **Vercel** or **Netlify** instead of GitHub Pages. This ensures:
- All application features work correctly
- Dynamic routing is preserved  
- Better performance and reliability
- Proper integration with your Railway backend

The GitHub Pages deployment can serve as a demo/presentation version with limited functionality.
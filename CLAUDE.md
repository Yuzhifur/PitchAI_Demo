# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PitchAI is an AI-powered project incubation evaluation system that analyzes business plans (BP) and provides multi-dimensional assessments. The system simulates evaluation committee work by providing objective, systematic project evaluations.

**Tech Stack:**
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Axios  
- Backend: FastAPI, Python 3.10+, SQLAlchemy, PostgreSQL (Supabase)
- AI Integration: DeepSeek API (OpenAI-compatible)
- Document Processing: PyPDF2 for PDF text extraction

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend (FastAPI)
```bash
cd backend
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload  # Runs on port 8000
```

### Mock Server (for testing)
```bash
cd frontend/mock
npm install
node server.js      # Runs on port 3001
```

## Architecture

### Backend Structure
- **FastAPI application** with modular router organization
- **API versioning** via `/api/v1` prefix
- **Layered architecture**: API routes → Services → Models → Database
- **Database**: Supabase (PostgreSQL) with SQLAlchemy ORM
- **File uploads**: Stored in `backend/uploads/business_plans/`
- **AI Integration**: DeepSeek client for business plan evaluation

Key backend files:
- `backend/app/main.py` - FastAPI app setup and routing
- `backend/app/core/config/settings.py` - Configuration management
- `backend/app/api/v1/` - API route handlers
- `backend/app/services/` - Business logic layer
- `backend/app/models/` - SQLAlchemy models

### Frontend Structure  
- **Next.js 14** with App Router
- **TypeScript** configuration with path aliases (`@/*`)
- **API integration** via centralized axios client (`src/lib/api.ts`)
- **Responsive design** with Tailwind CSS

Key frontend files:
- `frontend/src/lib/api.ts` - Centralized API client with interceptors
- `frontend/src/lib/types.ts` - TypeScript type definitions
- `frontend/src/app/` - Next.js App Router pages
- `frontend/src/components/` - Reusable React components

### API Architecture
The API client (`frontend/src/lib/api.ts`) provides:
- **Structured API clients**: `projectApi`, `scoreApi`, `businessPlanApi`, `reportApi`
- **Automatic error handling** with response interceptors
- **Token-based authentication** with localStorage persistence
- **Consistent response format** via `ApiResponse<T>` wrapper

## Key Patterns

### Error Handling
- Backend uses FastAPI's built-in exception handling
- Frontend API client provides user-friendly error messages in Chinese
- Authentication errors (401) automatically redirect to login

### File Upload Pattern
```typescript
// Frontend file upload
const formData = new FormData();
formData.append('file', file);
await businessPlanApi.upload(projectId, file);
```

### API Response Pattern
All API responses follow this structure:
```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

### Configuration Management
- Backend: Pydantic Settings with environment variable support
- Frontend: Next.js environment variables (`NEXT_PUBLIC_*`)
- Database: Supabase connection via environment variables

## Evaluation System

The system evaluates business plans across 5 dimensions (total 100 points):
1. **Team (30 points)** - Background, completeness, execution capability
2. **Product & Technology (20 points)** - Innovation, maturity, R&D capability  
3. **Market Competitiveness (20 points)** - Market size, competition, strategy
4. **Business Model (20 points)** - Profit model, operations, development
5. **Financial Situation (10 points)** - Financial status, funding needs

**Scoring thresholds:**
- Below 60: Not ready for incubation
- 60-80: Meets basic requirements (office registration)
- Above 80: Excellent project (office space consideration)

## Development Notes

- API base URL defaults to `http://localhost:8000/api/v1`
- CORS is configured for development (localhost:3000, 3001)
- File uploads support PDF format with size limits
- Database migrations are in `backend/supabase/migrations/`
- Authentication uses JWT tokens stored in localStorage
- All user-facing text is in Chinese
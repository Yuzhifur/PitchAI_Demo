# PitchAI - 智能项目入孵评审系统

PitchAI是一个基于人工智能的项目入孵评审系统，通过分析企业提交的商业计划书（BP）等信息，提供多维度评估和打分。
Test push TUN.

## 技术栈

### 前端
- Next.js 14
- Tailwind CSS
- TypeScript
- React Query
- Shadcn/ui

### 后端
- FastAPI
- Haystack
- Python 3.10+
- PostgreSQL

## 项目结构
```
PitchAI/
├── frontend/          # Next.js 前端项目
├── backend/           # FastAPI 后端项目
└── docs/             # 项目文档
```

## 开发环境设置

### 前端设置
```bash
cd frontend
npm install
npm run dev
```

### 后端设置
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 环境变量
请参考 `.env.example` 文件设置必要的环境变量。

## 许可证
MIT
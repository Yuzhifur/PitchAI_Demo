# PitchAI 工程结构与数据结构设计文档

## 1. 工程结构

```
PitchAI/
├── frontend/                # 前端项目目录
│   ├── src/
│   │   ├── app/            # Next.js 14 应用目录
│   │   │   ├── api/        # API 路由
│   │   │   ├── (auth)/     # 认证相关页面
│   │   │   ├── dashboard/  # 工作台页面
│   │   │   ├── projects/   # 项目相关页面
│   │   │   └── reports/    # 报告相关页面
│   │   ├── components/     # 可复用组件
│   │   ├── lib/           # 工具函数和库
│   │   ├── styles/        # 全局样式
│   │   └── types/         # TypeScript 类型定义
│   ├── public/            # 静态资源
│   └── package.json       # 前端依赖配置
│
├── backend/               # 后端项目目录
│   ├── app/
│   │   ├── api/          # API 路由
│   │   ├── core/         # 核心业务逻辑
│   │   ├── models/       # 数据模型
│   │   ├── services/     # 服务层
│   │   └── utils/        # 工具函数
│   ├── tests/            # 测试文件
│   └── requirements.txt  # Python 依赖配置
│
├── docs/                 # 项目文档
│   ├── PRD.md           # 产品需求文档
│   ├── ERD.md           # 工程结构文档
│   └── prototype/       # 界面原型
│
└── docker/              # Docker 配置
    ├── frontend/        # 前端容器配置
    ├── backend/         # 后端容器配置
    └── docker-compose.yml
```

## 2. 数据库设计

### 2.1 用户表 (users)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'admin', 'reviewer'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 项目表 (projects)
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enterprise_name VARCHAR(100) NOT NULL,  -- 企业名称
    project_name VARCHAR(100) NOT NULL,     -- 项目名称
    description TEXT,                       -- 项目描述（可选）
    status VARCHAR(20) NOT NULL,            -- 'pending_review', 'in_review', 'completed', 'needs_info'
    total_score DECIMAL(5,2),              -- 总分
    review_result VARCHAR(20),             -- 'pass', 'fail', 'pending'
    created_by UUID REFERENCES users(id),   -- 创建人
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3 商业计划书表 (business_plans)
```sql
CREATE TABLE business_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    file_path VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL -- 'processing', 'completed', 'failed'
);
```

### 2.4 评分表 (scores)
```sql
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    dimension VARCHAR(50) NOT NULL, -- 'team', 'product', 'market', 'business', 'finance'
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.5 评分详情表 (score_details)
```sql
CREATE TABLE score_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    score_id UUID REFERENCES scores(id),
    sub_dimension VARCHAR(50) NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.6 评审报告表 (review_reports)
```sql
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    report_path VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- 'full', 'summary'
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.7 缺失信息表 (missing_information)
```sql
CREATE TABLE missing_information (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    dimension VARCHAR(50) NOT NULL,
    information_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.8 评分历史表 (review_history)
```sql
CREATE TABLE review_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    total_score DECIMAL(5,2) NOT NULL,
    dimensions JSONB NOT NULL,              -- 存储所有维度的评分详情
    modified_by UUID REFERENCES users(id),  -- 修改人
    modification_notes TEXT,                -- 修改说明
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 评分历史表索引
CREATE INDEX idx_review_history_project_id ON review_history(project_id);
CREATE INDEX idx_review_history_created_at ON review_history(created_at);
```

## 3. 主要数据关系

1. 一个项目对应一个BP文档 (1:1)
2. 一个项目有多个维度的评分 (1:N)
3. 每个维度评分包含多个子维度评分 (1:N)
4. 一个项目可以生成一个评审报告 (1:1)
5. 一个项目可能有多个缺失信息记录 (1:N)

## 4. 索引设计

```sql
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 项目表索引
CREATE INDEX idx_projects_enterprise_name ON projects(enterprise_name);
CREATE INDEX idx_projects_project_name ON projects(project_name);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- 评分表索引
CREATE INDEX idx_scores_project_id ON scores(project_id);
CREATE INDEX idx_scores_dimension ON scores(dimension);

-- 评分详情表索引
CREATE INDEX idx_score_details_score_id ON score_details(score_id);
CREATE INDEX idx_score_details_sub_dimension ON score_details(sub_dimension);

-- 缺失信息表索引
CREATE INDEX idx_missing_information_project_id ON missing_information(project_id);
CREATE INDEX idx_missing_information_status ON missing_information(status);
```

## 5. 数据安全设计

1. 密码存储：使用 bcrypt 进行加密
2. 文件存储：使用安全的文件存储服务，支持访问控制
3. 数据备份：定期自动备份
4. 访问控制：基于角色的访问控制（RBAC）
5. 审计日志：记录关键操作日志

## 6. 性能优化设计

1. 数据库优化：
   - 合理使用索引
   - 定期维护和优化
   - 使用连接池

2. 文件处理：
   - 异步处理大文件
   - 分片上传
   - 文件压缩

3. 查询优化：
   - 分页查询
   - 延迟加载
   - 查询结果缓存 
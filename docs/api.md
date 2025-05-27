# PitchAI API 文档

## 基础信息

- 基础URL: `/api/v1`
- 认证方式: Bearer Token
- 响应格式: JSON
- 时间格式: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

## 通用响应格式

```json
{
  "code": 200,           // HTTP 状态码
  "message": "success",  // 响应消息
  "data": {}            // 响应数据
}
```

## 错误响应格式

```json
{
  "code": 400,           // HTTP 状态码
  "message": "错误信息",  // 错误描述
  "errors": []          // 详细错误信息（可选）
}
```

## 1. 认证相关 API

### 1.1 用户登录
- **POST** `/auth/login`
- **描述**: 用户登录接口
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "string",
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string"
    }
  }
}
```

## 2. 项目相关 API

### 2.1 创建项目
- **POST** `/projects`
- **描述**: 创建新项目
- **请求体**:
```json
{
  "enterprise_name": "string",
  "project_name": "string",
  "description": "string"
}
```
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "enterprise_name": "string",
    "project_name": "string",
    "description": "string",
    "status": "string",
    "created_at": "string"
  }
}
```

### 2.2 获取项目列表
- **GET** `/projects`
- **描述**: 获取项目列表
- **查询参数**:
  - `page`: 页码（默认1）
  - `size`: 每页数量（默认10）
  - `status`: 项目状态（可选）
  - `search`: 搜索关键词（可选）
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": "number",
    "items": [
      {
        "id": "uuid",
        "enterprise_name": "string",
        "project_name": "string",
        "status": "string",
        "total_score": "number",
        "review_result": "string",
        "created_at": "string"
      }
    ]
  }
}
```

### 2.3 获取项目详情
- **GET** `/projects/{project_id}`
- **描述**: 获取项目详细信息
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "enterprise_name": "string",
    "project_name": "string",
    "description": "string",
    "status": "string",
    "total_score": "number",
    "review_result": "string",
    "created_at": "string",
    "updated_at": "string",
    "business_plan": {
      "id": "uuid",
      "file_name": "string",
      "file_size": "number",
      "status": "string",
      "upload_time": "string"
    }
  }
}
```

## 3. BP文档相关 API

### 3.1 上传BP文档
- **POST** `/projects/{project_id}/business-plans`
- **描述**: 上传商业计划书
- **Content-Type**: `multipart/form-data`
- **请求体**:
  - `file`: 文件（PDF格式）
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "file_name": "string",
    "file_size": "number",
    "status": "string",
    "upload_time": "string"
  }
}
```

### 3.2 获取BP文档状态
- **GET** `/projects/{project_id}/business-plans/status`
- **描述**: 获取BP文档处理状态
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "status": "string",
    "progress": "number",
    "message": "string"
  }
}
```

## 4. 评分相关 API

### 4.1 获取项目评分
- **GET** `/projects/{project_id}/scores`
- **描述**: 获取项目评分详情
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total_score": "number",
    "dimensions": [
      {
        "dimension": "string",
        "score": "number",
        "max_score": "number",
        "comments": "string",
        "sub_dimensions": [
          {
            "sub_dimension": "string",
            "score": "number",
            "max_score": "number",
            "comments": "string"
          }
        ]
      }
    ]
  }
}
```

### 4.2 获取缺失信息
- **GET** `/projects/{project_id}/missing-information`
- **描述**: 获取项目缺失信息列表
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "dimension": "string",
        "information_type": "string",
        "description": "string",
        "status": "string"
      }
    ]
  }
}
```

## 5. 报告相关 API

### 5.1 获取评审报告
- **GET** `/projects/{project_id}/reports`
- **描述**: 获取项目评审报告
- **响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "report_url": "string",
    "generated_at": "string"
  }
}
```

### 5.2 下载评审报告
- **GET** `/projects/{project_id}/reports/download`
- **描述**: 下载评审报告PDF文件
- **响应**: PDF文件流

## 6. WebSocket API

### 6.1 BP处理状态实时更新
- **WebSocket** `/ws/projects/{project_id}/status`
- **描述**: 实时获取BP处理状态
- **消息格式**:
```json
{
  "status": "string",
  "progress": "number",
  "message": "string"
}
```

## 7. 错误码说明

- 200: 成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 500: 服务器内部错误

## 8. 注意事项

1. 所有请求需要在 Header 中携带 Token:
```
Authorization: Bearer <token>
```

2. 文件上传限制：
   - 最大文件大小：50MB
   - 支持的文件格式：PDF
   - 文件名长度限制：255字符

3. 分页参数限制：
   - 页码范围：1-1000
   - 每页数量范围：1-100

4. 请求频率限制：
   - 普通接口：100次/分钟
   - 文件上传：10次/分钟 
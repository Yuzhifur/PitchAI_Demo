const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const API_PREFIX = '/api/v1';

// 项目列表
app.get(`${API_PREFIX}/projects`, (req, res) => {
  res.json({
    data: {
      items: [
        {
          id: '1',
          enterprise_name: '测试企业C',
          project_name: 'AI智能投研',
          status: 'completed',
          total_score: 88,
          review_result: '通过',
          created_at: '2024-05-01T12:00:00Z',
        },
        {
          id: '2',
          enterprise_name: '测试企业B',
          project_name: '区块链金融',
          status: 'processing',
          total_score: null,
          review_result: null,
          created_at: '2024-05-02T12:00:00Z',
        },
      ],
      total: 2,
    },
  });
});

// 创建项目
app.post(`${API_PREFIX}/projects`, (req, res) => {
  res.json({
    data: {
      id: '3',
      ...req.body,
      status: 'processing',
      total_score: null,
      review_result: null,
      created_at: new Date().toISOString(),
    },
  });
});

// 项目详情
app.get(`${API_PREFIX}/projects/:id`, (req, res) => {
  const { id } = req.params;
  res.json({
    data: {
      id,
      enterprise_name: id === '1' ? '测试企业A' : '测试企业B',
      project_name: id === '1' ? 'AI智能投研' : '区块链金融',
      status: id === '1' ? 'completed' : 'processing',
      total_score: id === '1' ? 88 : null,
      review_result: id === '1' ? '通过' : null,
      created_at: '2024-05-01T12:00:00Z',
    },
  });
});

// 评分详情
app.get(`${API_PREFIX}/projects/:id/scores`, (req, res) => {
  res.json({
    data: {
      dimensions: [
        {
          dimension: '团队能力',
          score: 30,
          max_score: 40,
          comments: '团队经验丰富',
          sub_dimensions: [
            {
              sub_dimension: '核心成员',
              score: 18,
              max_score: 20,
              comments: '核心成员背景优秀',
            },
            {
              sub_dimension: '技术能力',
              score: 12,
              max_score: 20,
              comments: '技术能力较强',
            },
          ],
        },
        {
          dimension: '市场前景',
          score: 25,
          max_score: 30,
          comments: '市场空间大',
          sub_dimensions: [],
        },
      ],
    },
  });
});

// 更新评分
app.put(`${API_PREFIX}/projects/:id/scores`, (req, res) => {
  res.json({
    data: {
      dimensions: req.body.dimensions,
    },
  });
});

// 缺失信息
app.get(`${API_PREFIX}/projects/:id/missing-information`, (req, res) => {
  res.json({
    data: {
      items: [
        {
          dimension: '财务信息',
          information_type: '财务报表',
          description: '缺少2023年财务报表',
          status: 'pending',
        },
      ],
    },
  });
});

// 报告下载（返回 PDF 文件流，实际用 txt 代替）
app.get(`${API_PREFIX}/projects/:id/reports/download`, (req, res) => {
  const filePath = path.join(__dirname, 'mock-report.pdf');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=mock-report.pdf');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).send('Mock report not found');
  }
});

// 登录
app.post(`${API_PREFIX}/auth/login`, (req, res) => {
  res.json({
    data: {
      token: 'mock-token',
    },
  });
});

// BP文档上传
app.post(`${API_PREFIX}/projects/:id/business-plans`, (req, res) => {
  res.json({
    data: {
      message: '上传成功',
    },
  });
});

// BP文档处理状态
app.get(`${API_PREFIX}/projects/:id/business-plans/status`, (req, res) => {
  res.json({
    data: {
      progress: 80,
      message: '正在解析BP文档',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}`);
}); 
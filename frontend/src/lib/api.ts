import axios from 'axios';
import type { Score } from './types';

const api = axios.create({
  // baseURL: '/api/v1',
  baseURL: 'http://localhost:3001/api/v1',
  timeout: 30000,
});

// 请求拦截器：添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // 处理未认证情况
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关 API
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
};

// 项目相关 API
export const projectApi = {
  create: (data: { enterprise_name: string; project_name: string; description?: string }) =>
    api.post('/projects', data),
  list: (params: { page?: number; size?: number; status?: string; search?: string }) =>
    api.get('/projects', { params }),
  getDetail: (projectId: string) => api.get(`/projects/${projectId}`),
  // 获取项目统计信息
  getStatistics: () => api.get('/projects/statistics'),
};

// BP文档相关 API
export const businessPlanApi = {
  upload: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/projects/${projectId}/business-plans`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getStatus: (projectId: string) =>
    api.get(`/projects/${projectId}/business-plans/status`),
};

// 评分相关 API
export const scoreApi = {
  getScores: (projectId: string) => api.get(`/projects/${projectId}/scores`),
  getMissingInfo: (projectId: string) =>
    api.get(`/projects/${projectId}/missing-info`),
  updateScores: (projectId: string, scores: Score[]) => api.put(`/projects/${projectId}/scores`, { dimensions: scores }),
};

// 报告相关 API
export const reportApi = {
  getReport: (projectId: string) => api.get(`/projects/${projectId}/reports`),
  downloadReport: (projectId: string) =>
    api.get(`/projects/${projectId}/reports/download`, { responseType: 'blob' }),
};

export default api;
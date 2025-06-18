// File: frontend/src/lib/api.ts

import axios, { AxiosResponse } from 'axios';
import type {
  Project,
  ProjectCreateData,
  ProjectListParams,
  ProjectListResponse,
  ProjectStatistics,
  ProjectScores,
  MissingInfoResponse,
  ScoreUpdateData,
  ScoreSummary,
  ApiResponse
} from './types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  timeout: 150000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
const handleResponse = <T>(response: AxiosResponse<any>): ApiResponse<T> => {
  console.log('🔍 Raw API Response:', {
    status: response.status,
    data: response.data,
    dataType: typeof response.data,
    dataKeys: Object.keys(response.data || {})
  });

  // Check if response already has the expected structure
  if (response.data && typeof response.data === 'object' && 'code' in response.data) {
    return response.data;
  }

  // If not, wrap the response in the expected format
  return {
    code: response.status,
    message: 'success',
    data: response.data
  };
};

// Project API
export const projectApi = {
  // Get project statistics for dashboard
  getStatistics: async (): Promise<ApiResponse<ProjectStatistics>> => {
    const response = await api.get<ApiResponse<ProjectStatistics>>('/projects/statistics');
    return handleResponse(response);
  },

  // List projects with pagination and filtering
  list: async (params: ProjectListParams = {}): Promise<ApiResponse<ProjectListResponse>> => {
    const response = await api.get<ApiResponse<ProjectListResponse>>('/projects', { params });
    return handleResponse(response);
  },

  // Create a new project
  create: async (data: ProjectCreateData): Promise<ApiResponse<Project>> => {
    const response = await api.post<ApiResponse<Project>>('/projects', data);
    return handleResponse(response);
  },

  // Get project details
  getDetail: async (projectId: string): Promise<ApiResponse<Project>> => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
    return handleResponse(response);
  },

  // Update project
  update: async (projectId: string, data: Partial<ProjectCreateData>): Promise<ApiResponse<Project>> => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${projectId}`, data);
    return handleResponse(response);
  },

  // Delete project
  delete: async (projectId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/projects/${projectId}`);
    return handleResponse(response);
  },
};

// Score API
export const scoreApi = {
  // Get project scores
  getScores: async (projectId: string): Promise<ApiResponse<ProjectScores>> => {
    const response = await api.get<ApiResponse<ProjectScores>>(`/projects/${projectId}/scores`);
    return handleResponse(response);
  },

  // Update project scores
  updateScores: async (projectId: string, data: ScoreUpdateData): Promise<ApiResponse<ProjectScores>> => {
    const response = await api.put<ApiResponse<ProjectScores>>(`/projects/${projectId}/scores`, data);
    return handleResponse(response);
  },

  // Get missing information
  getMissingInfo: async (projectId: string): Promise<ApiResponse<MissingInfoResponse>> => {
    const response = await api.get<ApiResponse<MissingInfoResponse>>(`/projects/${projectId}/missing-information`);
    return handleResponse(response);
  },

  // Get score summary
  getScoreSummary: async (projectId: string): Promise<ApiResponse<ScoreSummary>> => {
    const response = await api.get<ApiResponse<ScoreSummary>>(`/projects/${projectId}/scores/summary`);
    return handleResponse(response);
  },
};

// Business Plan API
export const businessPlanApi = {
  // Upload business plan
  upload: async (projectId: string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<any>>(
      `/projects/${projectId}/business-plans`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return handleResponse(response);
  },

  // Get upload status
  getStatus: async (projectId: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/projects/${projectId}/business-plans/status`);
    return handleResponse(response);
  },
    // Get business plan information
  getInfo: async (projectId: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/projects/${projectId}/business-plans/info`);
    return handleResponse(response);
  },

  download: async (projectId: string): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/business-plans/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Helper method to trigger download with proper filename
  downloadAndSave: async (projectId: string, fallbackFilename: string = 'business_plan.pdf'): Promise<void> => {
    try {
      // Get BP info first to get the original filename
      const infoResponse = await businessPlanApi.getInfo(projectId);
      const fileName = infoResponse.data.file_name || fallbackFilename;

      // Download the file
      const blob = await businessPlanApi.download(projectId);

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw error;
    }
  },
};

// Report API
export const reportApi = {
  // Get report information
  getReport: async (projectId: string): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>(`/projects/${projectId}/reports`);
    return handleResponse(response);
  },

  // Download report
  downloadReport: async (projectId: string): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/reports/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Auth API
export const authApi = {
  // User login
  login: async (username: string, password: string): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/auth/login', { username, password });
    return handleResponse(response);
  },

  // Logout
  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
  },
};

// Export default api instance for custom requests
export default api;
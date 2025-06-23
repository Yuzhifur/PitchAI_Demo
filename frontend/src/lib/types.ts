// File: frontend/src/lib/types.ts

export interface Project {
  id: string;
  enterprise_name: string;
  project_name: string;
  description?: string;
  status: 'pending_review' | 'processing' | 'completed' | 'needs_info';
  total_score?: number;
  review_result?: 'pass' | 'fail' | 'conditional';
  created_at: string;
  updated_at: string;
}

export interface ProjectCreateData {
  enterprise_name: string;
  project_name: string;
  description?: string;
}

export interface ProjectListParams {
  page?: number;
  size?: number;
  status?: string;
  search?: string;
}

export interface ProjectListResponse {
  total: number;
  items: Project[];
}

export interface ProjectStatistics {
  pending_review: number;
  completed: number;
  needs_info: number;
  recent_projects: Project[];
}

export interface SubDimensionScore {
  sub_dimension: string;
  score: number;
  max_score: number;
  comments?: string;
}

export interface Score {
  dimension: string;
  score: number;
  max_score: number;
  comments?: string;
  sub_dimensions: SubDimensionScore[];
}

export interface ProjectScores {
  dimensions: Score[];
}

export interface MissingInfo {
  dimension: string;
  information_type: string;
  description: string;
  status: string;
}

export interface MissingInfoResponse {
  items: MissingInfo[];
}

export interface ScoreUpdateData {
  dimensions: Score[];
}

export interface ScoreSummary {
  project_id: string;
  project_name: string;
  enterprise_name: string;
  total_score: number;
  total_possible: number;
  overall_percentage: number;
  recommendation: string;
  dimension_breakdown: {
    [dimension: string]: {
      score: number;
      max_score: number;
      percentage: number;
    };
  };
  last_updated: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Error response
export interface ApiError {
  code: number;
  message: string;
  errors?: string[];
}

export interface ScoreHistoryItem {
  id: string;
  total_score: number;
  modified_by: string;
  modification_notes: string;
  created_at: string;
  dimensions: {
    [dimensionName: string]: {
      score: number;
      max_score: number;
      comments: string;
      sub_dimensions: SubDimensionScore[];
    };
  };
}

export interface ScoreHistoryResponse {
  project_id: string;
  project_name: string;
  enterprise_name: string;
  history: ScoreHistoryItem[];
}
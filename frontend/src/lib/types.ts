export interface Project {
  id: string;
  enterprise_name: string;
  project_name: string;
  description?: string;
  status: 'processing' | 'completed' | 'failed';
  total_score?: number;
  review_result?: string;
  created_at: string;
}

export interface Score {
  dimension: string;
  score: number;
  max_score: number;
  comments: string;
  sub_dimensions: {
    sub_dimension: string;
    score: number;
    max_score: number;
    comments: string;
  }[];
}

export interface MissingInfo {
  dimension: string;
  information_type: string;
  description: string;
  status: 'pending' | 'completed';
}

export interface ProcessingStatus {
  progress: number;
  message: string;
} 
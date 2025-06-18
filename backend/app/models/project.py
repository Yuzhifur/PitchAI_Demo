# File: backend/app/models/project.py

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ProjectStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    PROCESSING = "processing"
    COMPLETED = "completed"
    NEEDS_INFO = "needs_info"


class ReviewResult(str, Enum):
    PASS = "pass"
    FAIL = "fail"
    CONDITIONAL = "conditional"


class ProjectBase(BaseModel):
    enterprise_name: str = Field(..., min_length=1, max_length=255)
    project_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    enterprise_name: Optional[str] = Field(None, min_length=1, max_length=255)
    project_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    review_result: Optional[ReviewResult] = None


class ProjectInDB(ProjectBase):
    id: str
    status: ProjectStatus = ProjectStatus.PENDING_REVIEW
    total_score: Optional[float] = None
    review_result: Optional[ReviewResult] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectList(BaseModel):
    total: int
    items: List[ProjectInDB]


class ProjectStatistics(BaseModel):
    pending_review: int
    completed: int
    needs_info: int
    recent_projects: List[ProjectInDB]


class ProjectDetail(ProjectInDB):
    """Extended project information for detail views"""
    pass


# Query parameters for listing projects
class ProjectListParams(BaseModel):
    page: int = Field(1, ge=1, le=1000)
    size: int = Field(10, ge=1, le=100)
    status: Optional[ProjectStatus] = None
    search: Optional[str] = Field(None, max_length=255)

    class Config:
        extra = "forbid"
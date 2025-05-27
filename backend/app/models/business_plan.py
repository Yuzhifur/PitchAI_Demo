from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class BusinessPlanStatus(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class BusinessPlanBase(BaseModel):
    project_id: str
    file_name: str
    file_size: int
    status: BusinessPlanStatus = BusinessPlanStatus.PROCESSING
    upload_time: datetime = Field(default_factory=datetime.utcnow)


class BusinessPlanCreate(BusinessPlanBase):
    pass


class BusinessPlanUpdate(BaseModel):
    status: Optional[BusinessPlanStatus] = None
    error_message: Optional[str] = None


class BusinessPlanInDB(BusinessPlanBase):
    id: str
    error_message: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

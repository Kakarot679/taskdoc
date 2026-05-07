from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
from app.schemas.user import UserBrief


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    due_date: Optional[date] = None
    assigned_to: Optional[int] = None
    project_id: int

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Task title cannot be empty")
        return v.strip()

    @field_validator("status")
    @classmethod
    def valid_status(cls, v):
        if v not in ("todo", "in_progress", "completed"):
            raise ValueError("Invalid status value")
        return v

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v):
        if v not in ("low", "medium", "high"):
            raise ValueError("Invalid priority value")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None
    assigned_to: Optional[int] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError("Task title is required")
        return v.strip() if v is not None else v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v):
        if v is not None and v not in ("todo", "in_progress", "completed"):
            raise ValueError("Invalid status value")
        return v

    @field_validator("priority")
    @classmethod
    def valid_priority(cls, v):
        if v is not None and v not in ("low", "medium", "high"):
            raise ValueError("Invalid priority value")
        return v


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    due_date: Optional[date]
    assigned_to: Optional[int]
    project_id: int
    created_at: datetime
    assignee: Optional[UserBrief] = None

    model_config = {"from_attributes": True}

from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.schemas.user import UserBrief


class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, value):
        if not value.strip():
            raise ValueError("Project title is required")
        return value.strip()


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, value):
        if value is not None and not value.strip():
            raise ValueError("Project title is required")
        return value.strip() if value is not None else value


class ProjectOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_by: int
    created_at: datetime
    creator: UserBrief
    member_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: int

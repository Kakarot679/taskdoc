from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from app.schemas.user import UserBrief


class CommentCreate(BaseModel):
    body: str = Field(max_length=2000)

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Comment cannot be empty")
        return v.strip()


class CommentOut(BaseModel):
    id: int
    task_id: int
    user_id: int
    body: str
    created_at: datetime
    author: UserBrief

    model_config = {"from_attributes": True}

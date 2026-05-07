from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.db import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum("todo", "in_progress", "completed"), default="todo", nullable=False)
    priority = Column(Enum("low", "medium", "high"), default="medium", nullable=False)
    due_date = Column(Date, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    assignee = relationship("User", back_populates="assigned_tasks")
    project = relationship("Project", back_populates="tasks")

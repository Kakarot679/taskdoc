from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from app.database.db import get_db
from app.models.task import Task
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()

    if current_user.role == "admin":
        all_tasks = db.query(Task).all()
        total_projects = db.query(Project).count()
        total_members = db.query(User).count()
    else:
        all_tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
        member_project_ids = [
            m.project_id for m in db.query(ProjectMember).filter(
                ProjectMember.user_id == current_user.id
            ).all()
        ]
        total_projects = len(member_project_ids)
        total_members = None

    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.status == "completed")
    in_progress = sum(1 for t in all_tasks if t.status == "in_progress")
    todo = sum(1 for t in all_tasks if t.status == "todo")
    overdue = sum(
        1 for t in all_tasks
        if t.due_date and t.due_date < today and t.status != "completed"
    )

    recent_tasks = sorted(all_tasks, key=lambda t: t.created_at, reverse=True)[:5]
    upcoming = [
        t for t in all_tasks
        if t.due_date and t.due_date >= today and t.status != "completed"
    ]
    upcoming = sorted(upcoming, key=lambda t: t.due_date)[:5]

    def task_dict(t):
        return {
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "due_date": str(t.due_date) if t.due_date else None,
            "project_id": t.project_id,
        }

    result = {
        "total_tasks": total,
        "completed": completed,
        "in_progress": in_progress,
        "todo": todo,
        "overdue": overdue,
        "total_projects": total_projects,
        "recent_tasks": [task_dict(t) for t in recent_tasks],
        "upcoming_deadlines": [task_dict(t) for t in upcoming],
    }

    if total_members is not None:
        result["total_members"] = total_members

    return result

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database.db import get_db
from app.models.task import Task
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/tasks", tags=["tasks"])


def is_project_member(db: Session, project_id: int, user_id: int) -> bool:
    return db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first() is not None


@router.post("/", response_model=TaskOut, status_code=201)
def create_task(
    body: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    project = db.query(Project).filter(Project.id == body.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if body.due_date and body.due_date < date.today():
        raise HTTPException(status_code=400, detail="Due date cannot be in the past")

    if body.assigned_to:
        if not is_project_member(db, body.project_id, body.assigned_to):
            raise HTTPException(
                status_code=400,
                detail="Assigned user is not a member of this project"
            )

    task = Task(
        title=body.title,
        description=body.description,
        status=body.status,
        priority=body.priority,
        due_date=body.due_date,
        assigned_to=body.assigned_to,
        project_id=body.project_id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/", response_model=List[TaskOut])
def list_tasks(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if project_id:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if current_user.role != "admin" and not is_project_member(db, project_id, current_user.id):
            raise HTTPException(status_code=403, detail="You're not a member of this project")

    query = db.query(Task)

    if current_user.role == "member":
        query = query.filter(Task.assigned_to == current_user.id)

    if project_id:
        query = query.filter(Task.project_id == project_id)

    return query.order_by(Task.created_at.desc()).all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "member" and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return task


@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    body: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # members can only update status of their own tasks
    if current_user.role == "member":
        if task.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="You can only update your own tasks")
        if body.status:
            task.status = body.status
        db.commit()
        db.refresh(task)
        return task

    # admin can update everything
    if body.title is not None:
        task.title = body.title
    if body.description is not None:
        task.description = body.description
    if body.status is not None:
        task.status = body.status
    if body.priority is not None:
        task.priority = body.priority
    if body.due_date is not None:
        if body.due_date < date.today():
            raise HTTPException(status_code=400, detail="Due date cannot be in the past")
        task.due_date = body.due_date
    if body.assigned_to is not None:
        if not is_project_member(db, task.project_id, body.assigned_to):
            raise HTTPException(
                status_code=400,
                detail="Assigned user is not a member of this project"
            )
        task.assigned_to = body.assigned_to

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

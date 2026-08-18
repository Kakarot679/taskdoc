from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.task import Task
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/tasks/{task_id}/comments", tags=["comments"])


def _get_visible_task(db: Session, task_id: int, current_user: User) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role == "member" and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return task


@router.get("", response_model=List[CommentOut], include_in_schema=False)
@router.get("/", response_model=List[CommentOut])
def list_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_visible_task(db, task_id, current_user)
    return (
        db.query(Comment)
        .filter(Comment.task_id == task_id)
        .order_by(Comment.created_at.asc())
        .all()
    )


@router.post("", response_model=CommentOut, status_code=201, include_in_schema=False)
@router.post("/", response_model=CommentOut, status_code=201)
def create_comment(
    task_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_visible_task(db, task_id, current_user)

    comment = Comment(task_id=task_id, user_id=current_user.id, body=body.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{comment_id}", status_code=204)
def delete_comment(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_visible_task(db, task_id, current_user)

    comment = (
        db.query(Comment)
        .filter(Comment.id == comment_id, Comment.task_id == task_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if current_user.role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    db.delete(comment)
    db.commit()

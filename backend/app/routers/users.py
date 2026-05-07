from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.user import User
from app.schemas.user import UserBrief, UserOut, UserUpdate
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserBrief], include_in_schema=False)
@router.get("/", response_model=List[UserBrief])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    return db.query(User).order_by(User.name).all()


@router.put("/me", response_model=UserOut)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    duplicate = db.query(User).filter(
        User.email == body.email,
        User.id != current_user.id
    ).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Email already registered")

    current_user.name = body.name
    current_user.email = body.email
    db.commit()
    db.refresh(current_user)
    return current_user

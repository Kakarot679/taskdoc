from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut, AddMemberRequest
from app.schemas.user import UserBrief
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/projects", tags=["projects"])


def is_project_member(db: Session, project_id: int, user_id: int) -> bool:
    return db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first() is not None


@router.post("/", response_model=ProjectOut, status_code=201)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    project = Project(
        title=body.title,
        description=body.description,
        created_by=current_user.id
    )
    db.add(project)
    db.flush()

    # auto-add creator as member
    membership = ProjectMember(project_id=project.id, user_id=current_user.id)
    db.add(membership)
    db.commit()
    db.refresh(project)

    project.member_count = len(project.members)
    return project


@router.get("/", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        projects = db.query(Project).order_by(Project.created_at.desc()).all()
    else:
        memberships = db.query(ProjectMember).filter(
            ProjectMember.user_id == current_user.id
        ).all()
        project_ids = [m.project_id for m in memberships]
        projects = db.query(Project).filter(Project.id.in_(project_ids)).order_by(
            Project.created_at.desc()
        ).all()

    for p in projects:
        p.member_count = len(p.members)
    return projects


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin" and not is_project_member(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="You're not a member of this project")

    project.member_count = len(project.members)
    return project


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    body: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if body.title is not None:
        project.title = body.title
    if body.description is not None:
        project.description = body.description

    db.commit()
    db.refresh(project)
    project.member_count = len(project.members)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()


@router.post("/{project_id}/members", status_code=201)
def add_member(
    project_id: int,
    body: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    user = db.query(User).filter(User.id == body.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    already_member = is_project_member(db, project_id, body.user_id)
    if already_member:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = ProjectMember(project_id=project_id, user_id=body.user_id)
    db.add(member)
    db.commit()
    return {"message": f"{user.name} added to project"}


@router.get("/{project_id}/members", response_model=List[UserBrief])
def get_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role != "admin" and not is_project_member(db, project_id, current_user.id):
        raise HTTPException(status_code=403, detail="You're not a member of this project")

    members = [pm.user for pm in project.members]
    return members


@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this project")

    db.delete(membership)
    db.commit()

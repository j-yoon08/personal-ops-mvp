from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Brief, Task
from app.schemas import BriefCreate, BriefRead, BriefUpdate

from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/briefs", tags=["briefs"])

@router.post("", response_model=BriefRead)
def create_brief(payload: BriefCreate, session: Session = Depends(get_session)):
    t = session.get(Task, payload.task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    b = Brief(
        task_id=payload.task_id,
        purpose=payload.purpose,
        success_criteria=payload.success_criteria,
        constraints=payload.constraints,
        priority=payload.priority,
        validation=payload.validation,
    )
    try:
        session.add(b)
        session.commit()
        session.refresh(b)
    except IntegrityError:
        session.rollback()
        # 1:1 제약: 동일 task에 이미 Brief 존재
        raise HTTPException(409, "Brief already exists for this task (1:1)")
    return b

@router.get("", response_model=list[BriefRead])
def list_briefs(session: Session = Depends(get_session)):
    return session.exec(select(Brief)).all()

@router.get("/task/{task_id}", response_model=BriefRead)
def get_brief_by_task(task_id: int, session: Session = Depends(get_session)):
    brief = session.exec(select(Brief).where(Brief.task_id == task_id)).first()
    if not brief:
        raise HTTPException(404, "Brief not found")
    return brief

@router.patch("/{brief_id}", response_model=BriefRead)
def update_brief(brief_id: int, payload: BriefUpdate, session: Session = Depends(get_session)):
    brief = session.get(Brief, brief_id)
    if not brief:
        raise HTTPException(404, "Brief not found")
    if payload.purpose is not None:
        brief.purpose = payload.purpose
    if payload.success_criteria is not None:
        brief.success_criteria = payload.success_criteria
    if payload.constraints is not None:
        brief.constraints = payload.constraints
    if payload.priority is not None:
        brief.priority = payload.priority
    if payload.validation is not None:
        brief.validation = payload.validation
    session.add(brief)
    session.commit()
    session.refresh(brief)
    return brief

@router.delete("/{brief_id}")
def delete_brief(brief_id: int, session: Session = Depends(get_session)):
    brief = session.get(Brief, brief_id)
    if not brief:
        raise HTTPException(404, "Brief not found")
    session.delete(brief); session.commit()
    return {"message": "Brief deleted"}

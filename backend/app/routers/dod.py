from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import DoD, Task
from app.schemas import DoDCreate
from sqlalchemy.exc import IntegrityError

router = APIRouter(prefix="/dod", tags=["dod"])

@router.post("", response_model=dict)
def create_dod(payload: DoDCreate, session: Session = Depends(get_session)):
    t = session.get(Task, payload.task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    d = DoD(
        task_id=payload.task_id,
        deliverable_formats=payload.deliverable_formats,
        mandatory_checks=payload.mandatory_checks,  # store as list, JSON column handles serialization
        quality_bar=payload.quality_bar,
        verification=payload.verification,
        deadline=payload.deadline,
        version_tag=payload.version_tag,
    )
    t.dod_checked = True
    try:
        session.add_all([d, t])
        session.commit()
        session.refresh(d)
    except IntegrityError:
        session.rollback()
        # 1:1 제약 위반(해당 task에 이미 DoD 존재)
        raise HTTPException(409, "DoD already exists for this task (1:1)")
    return {"id": d.id}

@router.get("", response_model=list[DoD])
def list_dods(session: Session = Depends(get_session)):
    return session.exec(select(DoD)).all()

@router.get("/task/{task_id}", response_model=DoD)
def get_dod_by_task(task_id: int, session: Session = Depends(get_session)):
    dod = session.exec(select(DoD).where(DoD.task_id == task_id)).first()
    if not dod:
        raise HTTPException(404, "DoD not found")
    return dod

@router.patch("/{dod_id}", response_model=DoD)
def update_dod(dod_id: int, payload: DoDCreate, session: Session = Depends(get_session)):
    dod = session.get(DoD, dod_id)
    if not dod:
        raise HTTPException(404, "DoD not found")
    dod.deliverable_formats = payload.deliverable_formats
    dod.mandatory_checks = payload.mandatory_checks
    dod.quality_bar = payload.quality_bar
    dod.verification = payload.verification
    dod.deadline = payload.deadline
    dod.version_tag = payload.version_tag
    session.add(dod); session.commit(); session.refresh(dod)
    return dod

@router.delete("/{dod_id}")
def delete_dod(dod_id: int, session: Session = Depends(get_session)):
    dod = session.get(DoD, dod_id)
    if not dod:
        raise HTTPException(404, "DoD not found")
    # DoD 삭제 시 해당 Task의 dod_checked를 False로 설정
    task = session.get(Task, dod.task_id)
    if task:
        task.dod_checked = False
        session.add(task)
    session.delete(dod); session.commit()
    return {"message": "DoD deleted"}

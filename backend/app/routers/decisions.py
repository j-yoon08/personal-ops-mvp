from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import DecisionLog, Task
from app.schemas import DecisionLogCreate, DecisionLogReviewUpdate

router = APIRouter(prefix="/decisions", tags=["decisions"])

@router.post("")
def create_decision(payload: DecisionLogCreate, session: Session = Depends(get_session)):
    t = session.get(Task, payload.task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    d = DecisionLog(task_id=payload.task_id, date=payload.date, problem=payload.problem,
                    options=payload.options, decision_reason=payload.decision_reason, assumptions_risks=payload.assumptions_risks)
    session.add(d); session.commit(); session.refresh(d)
    return {"id": d.id}

@router.get("", response_model=list[DecisionLog])
def list_decisions(session: Session = Depends(get_session)):
    return session.exec(select(DecisionLog)).all()

@router.get("/task/{task_id}", response_model=list[DecisionLog])
def get_decisions_by_task(task_id: int, session: Session = Depends(get_session)):
    return session.exec(select(DecisionLog).where(DecisionLog.task_id == task_id)).all()

@router.patch("/{decision_id}/dplus7", response_model=DecisionLog)
def update_dplus7(decision_id: int, payload: DecisionLogReviewUpdate, session: Session = Depends(get_session)):
    d = session.get(DecisionLog, decision_id)
    if not d:
        raise HTTPException(404, "Decision not found")
    d.d_plus_7_review = payload.d_plus_7_review
    session.add(d); session.commit(); session.refresh(d)
    return d

@router.delete("/{decision_id}")
def delete_decision(decision_id: int, session: Session = Depends(get_session)):
    decision = session.get(DecisionLog, decision_id)
    if not decision:
        raise HTTPException(404, "Decision not found")
    session.delete(decision); session.commit()
    return {"message": "Decision deleted"}

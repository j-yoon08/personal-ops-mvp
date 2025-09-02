from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Sample, Task
from app.schemas import SampleCreate

router = APIRouter(prefix="/samples", tags=["samples"])

@router.post("", response_model=dict)
def create_sample(payload: SampleCreate, session: Session = Depends(get_session)):
    t = session.get(Task, payload.task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    s = Sample(task_id=payload.task_id, proportion=payload.proportion, notes=payload.notes, approved=payload.approved)
    session.add(s); session.commit(); session.refresh(s)
    return {"id": s.id}

@router.get("", response_model=list[Sample])
def list_samples(session: Session = Depends(get_session)):
    return session.exec(select(Sample)).all()

@router.get("/task/{task_id}", response_model=list[Sample])
def get_samples_by_task(task_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Sample).where(Sample.task_id == task_id)).all()

@router.patch("/{sample_id}", response_model=Sample)
def update_sample(sample_id: int, payload: SampleCreate, session: Session = Depends(get_session)):
    sample = session.get(Sample, sample_id)
    if not sample:
        raise HTTPException(404, "Sample not found")
    sample.proportion = payload.proportion
    sample.notes = payload.notes
    sample.approved = payload.approved
    session.add(sample); session.commit(); session.refresh(sample)
    return sample

@router.delete("/{sample_id}")
def delete_sample(sample_id: int, session: Session = Depends(get_session)):
    sample = session.get(Sample, sample_id)
    if not sample:
        raise HTTPException(404, "Sample not found")
    session.delete(sample); session.commit()
    return {"message": "Sample deleted"}

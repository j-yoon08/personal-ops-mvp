from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.models import Review, Task, ReviewType
from app.schemas import ReviewCreate

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("", response_model=dict)
def create_review(payload: ReviewCreate, session: Session = Depends(get_session)):
    t = session.get(Task, payload.task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    r = Review(task_id=payload.task_id, review_type=payload.review_type,
               positives=payload.positives, negatives=payload.negatives, changes_next=payload.changes_next)
    session.add(r); session.commit(); session.refresh(r)
    return {"id": r.id}

@router.get("", response_model=list[Review])
def list_reviews(session: Session = Depends(get_session)):
    return session.exec(select(Review)).all()

@router.get("/task/{task_id}", response_model=list[Review])
def get_reviews_by_task(task_id: int, session: Session = Depends(get_session)):
    return session.exec(select(Review).where(Review.task_id == task_id)).all()

@router.patch("/{review_id}", response_model=Review)
def update_review(review_id: int, payload: ReviewCreate, session: Session = Depends(get_session)):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    review.review_type = payload.review_type
    review.positives = payload.positives
    review.negatives = payload.negatives
    review.changes_next = payload.changes_next
    session.add(review); session.commit(); session.refresh(review)
    return review

@router.delete("/{review_id}")
def delete_review(review_id: int, session: Session = Depends(get_session)):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    session.delete(review); session.commit()
    return {"message": "Review deleted"}

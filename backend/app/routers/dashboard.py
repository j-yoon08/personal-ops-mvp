from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.services.kpi import compute_kpis

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/kpi")
def get_kpis(session: Session = Depends(get_session)):
    return compute_kpis(session)

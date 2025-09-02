from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from datetime import datetime, timezone

from app.db.session import get_session
from app.models import Notification, NotificationSettings, NotificationStatus
from app.services.notifications import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[dict])
def get_notifications(
    status: NotificationStatus = None,
    limit: int = 50,
    session: Session = Depends(get_session)
):
    """알림 목록을 가져옵니다."""
    query = select(Notification).order_by(Notification.created_at.desc())
    
    if status:
        query = query.where(Notification.status == status)
    
    query = query.limit(limit)
    notifications = session.exec(query).all()
    
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "status": n.status,
            "task_id": n.task_id,
            "project_id": n.project_id,
            "scheduled_for": n.scheduled_for.isoformat(),
            "sent_at": n.sent_at.isoformat() if n.sent_at else None,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "dismissed_at": n.dismissed_at.isoformat() if n.dismissed_at else None,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]

@router.get("/pending", response_model=List[dict])
def get_pending_notifications(session: Session = Depends(get_session)):
    """대기중인 알림들을 가져옵니다."""
    service = NotificationService(session)
    notifications = service.get_pending_notifications()
    
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "status": n.status,
            "task_id": n.task_id,
            "project_id": n.project_id,
            "scheduled_for": n.scheduled_for.isoformat(),
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]

@router.post("/generate")
def generate_notifications(session: Session = Depends(get_session)):
    """새로운 알림들을 생성합니다."""
    service = NotificationService(session)
    notifications = service.generate_all_notifications()
    
    return {
        "message": f"{len(notifications)}개의 새로운 알림이 생성되었습니다.",
        "count": len(notifications)
    }

@router.patch("/{notification_id}/mark-read")
def mark_notification_read(
    notification_id: int,
    session: Session = Depends(get_session)
):
    """알림을 읽음으로 표시합니다."""
    service = NotificationService(session)
    service.mark_notification_read(notification_id)
    return {"message": "알림이 읽음으로 표시되었습니다."}

@router.patch("/{notification_id}/dismiss")
def dismiss_notification(
    notification_id: int,
    session: Session = Depends(get_session)
):
    """알림을 해제합니다."""
    service = NotificationService(session)
    service.dismiss_notification(notification_id)
    return {"message": "알림이 해제되었습니다."}

@router.get("/settings", response_model=dict)
def get_notification_settings(session: Session = Depends(get_session)):
    """알림 설정을 가져옵니다."""
    service = NotificationService(session)
    settings = service.get_or_create_settings()
    
    return {
        "id": settings.id,
        "due_date_reminder_days": settings.due_date_reminder_days,
        "enable_due_date_reminders": settings.enable_due_date_reminders,
        "enable_missing_brief_alerts": settings.enable_missing_brief_alerts,
        "enable_missing_dod_alerts": settings.enable_missing_dod_alerts,
        "stale_task_days": settings.stale_task_days,
        "enable_stale_task_alerts": settings.enable_stale_task_alerts,
        "enable_review_reminders": settings.enable_review_reminders,
        "review_reminder_frequency_days": settings.review_reminder_frequency_days,
    }

@router.patch("/settings", response_model=dict)
def update_notification_settings(
    settings_update: dict,
    session: Session = Depends(get_session)
):
    """알림 설정을 업데이트합니다."""
    service = NotificationService(session)
    settings = service.get_or_create_settings()
    
    # 허용된 필드만 업데이트
    allowed_fields = {
        'due_date_reminder_days', 'enable_due_date_reminders',
        'enable_missing_brief_alerts', 'enable_missing_dod_alerts',
        'stale_task_days', 'enable_stale_task_alerts',
        'enable_review_reminders', 'review_reminder_frequency_days'
    }
    
    for field, value in settings_update.items():
        if field in allowed_fields and hasattr(settings, field):
            setattr(settings, field, value)
    
    settings.updated_at = datetime.now(timezone.utc)
    session.commit()
    session.refresh(settings)
    
    return {
        "message": "알림 설정이 업데이트되었습니다.",
        "settings": {
            "id": settings.id,
            "due_date_reminder_days": settings.due_date_reminder_days,
            "enable_due_date_reminders": settings.enable_due_date_reminders,
            "enable_missing_brief_alerts": settings.enable_missing_brief_alerts,
            "enable_missing_dod_alerts": settings.enable_missing_dod_alerts,
            "stale_task_days": settings.stale_task_days,
            "enable_stale_task_alerts": settings.enable_stale_task_alerts,
            "enable_review_reminders": settings.enable_review_reminders,
            "review_reminder_frequency_days": settings.review_reminder_frequency_days,
        }
    }

@router.get("/stats", response_model=dict)
def get_notification_stats(session: Session = Depends(get_session)):
    """알림 통계를 가져옵니다."""
    pending_count = session.exec(
        select(Notification).where(Notification.status == NotificationStatus.PENDING)
    ).all()
    
    sent_count = session.exec(
        select(Notification).where(Notification.status == NotificationStatus.SENT)
    ).all()
    
    read_count = session.exec(
        select(Notification).where(Notification.status == NotificationStatus.READ)
    ).all()
    
    dismissed_count = session.exec(
        select(Notification).where(Notification.status == NotificationStatus.DISMISSED)
    ).all()
    
    return {
        "pending": len(pending_count),
        "sent": len(sent_count),
        "read": len(read_count),
        "dismissed": len(dismissed_count),
        "total": len(pending_count) + len(sent_count) + len(read_count) + len(dismissed_count)
    }
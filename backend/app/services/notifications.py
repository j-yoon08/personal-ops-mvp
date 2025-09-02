from datetime import datetime, timedelta, timezone
from typing import List
from sqlmodel import Session, select
from app.models import (
    Notification, NotificationSettings, NotificationType, NotificationStatus,
    Task, TaskState, Project, Brief, DoD, Review
)

class NotificationService:
    def __init__(self, session: Session):
        self.session = session
        
    def get_or_create_settings(self) -> NotificationSettings:
        """알림 설정을 가져오거나 기본 설정을 생성합니다."""
        settings = self.session.exec(select(NotificationSettings)).first()
        if not settings:
            settings = NotificationSettings()
            self.session.add(settings)
            self.session.commit()
            self.session.refresh(settings)
        return settings
    
    def generate_due_date_notifications(self) -> List[Notification]:
        """마감일 기반 알림을 생성합니다."""
        settings = self.get_or_create_settings()
        if not settings.enable_due_date_reminders:
            return []
            
        notifications = []
        now = datetime.now(timezone.utc)
        reminder_date = now + timedelta(days=settings.due_date_reminder_days)
        
        # 마감일이 다가오는 작업들 찾기
        upcoming_tasks = self.session.exec(
            select(Task).where(
                Task.due_date.is_not(None),
                Task.state.in_([TaskState.BACKLOG, TaskState.IN_PROGRESS]),
                Task.due_date <= reminder_date.date()
            )
        ).all()
        
        for task in upcoming_tasks:
            # 이미 해당 작업에 대한 알림이 있는지 확인
            existing = self.session.exec(
                select(Notification).where(
                    Notification.task_id == task.id,
                    Notification.type == NotificationType.DUE_DATE_REMINDER,
                    Notification.status.in_([NotificationStatus.PENDING, NotificationStatus.SENT])
                )
            ).first()
            
            if not existing:
                days_until_due = (task.due_date - now.date()).days
                if days_until_due == 0:
                    title = f"📅 오늘 마감: {task.title}"
                    message = f"작업 '{task.title}'이 오늘 마감입니다."
                elif days_until_due < 0:
                    title = f"⚠️ 마감 초과: {task.title}"
                    message = f"작업 '{task.title}'이 {abs(days_until_due)}일 지연되었습니다."
                else:
                    title = f"📅 마감 {days_until_due}일 전: {task.title}"
                    message = f"작업 '{task.title}'이 {days_until_due}일 후 마감입니다."
                
                notification = Notification(
                    type=NotificationType.DUE_DATE_REMINDER,
                    title=title,
                    message=message,
                    task_id=task.id,
                    project_id=task.project_id,
                    scheduled_for=now
                )
                notifications.append(notification)
                
        return notifications
    
    def generate_missing_component_notifications(self) -> List[Notification]:
        """5SB, DoD 미작성 알림을 생성합니다."""
        settings = self.get_or_create_settings()
        notifications = []
        now = datetime.now(timezone.utc)
        
        # 활성화된 작업들 가져오기
        active_tasks = self.session.exec(
            select(Task).where(
                Task.state.in_([TaskState.BACKLOG, TaskState.IN_PROGRESS])
            )
        ).all()
        
        for task in active_tasks:
            # 5SB 미작성 체크
            if settings.enable_missing_brief_alerts:
                brief = self.session.exec(
                    select(Brief).where(Brief.task_id == task.id)
                ).first()
                
                if not brief:
                    existing = self.session.exec(
                        select(Notification).where(
                            Notification.task_id == task.id,
                            Notification.type == NotificationType.MISSING_BRIEF,
                            Notification.status.in_([NotificationStatus.PENDING, NotificationStatus.SENT])
                        )
                    ).first()
                    
                    if not existing:
                        notification = Notification(
                            type=NotificationType.MISSING_BRIEF,
                            title=f"📝 5SB 미작성: {task.title}",
                            message=f"작업 '{task.title}'의 5문장 브리프를 작성해주세요.",
                            task_id=task.id,
                            project_id=task.project_id,
                            scheduled_for=now
                        )
                        notifications.append(notification)
            
            # DoD 미작성 체크
            if settings.enable_missing_dod_alerts:
                dod = self.session.exec(
                    select(DoD).where(DoD.task_id == task.id)
                ).first()
                
                if not dod:
                    existing = self.session.exec(
                        select(Notification).where(
                            Notification.task_id == task.id,
                            Notification.type == NotificationType.MISSING_DOD,
                            Notification.status.in_([NotificationStatus.PENDING, NotificationStatus.SENT])
                        )
                    ).first()
                    
                    if not existing:
                        notification = Notification(
                            type=NotificationType.MISSING_DOD,
                            title=f"🎯 DoD 미설정: {task.title}",
                            message=f"작업 '{task.title}'의 완료 정의(DoD)를 설정해주세요.",
                            task_id=task.id,
                            project_id=task.project_id,
                            scheduled_for=now
                        )
                        notifications.append(notification)
                        
        return notifications
    
    def generate_stale_task_notifications(self) -> List[Notification]:
        """장기간 미진행 작업 알림을 생성합니다."""
        settings = self.get_or_create_settings()
        if not settings.enable_stale_task_alerts:
            return []
            
        notifications = []
        now = datetime.now(timezone.utc)
        stale_threshold = now - timedelta(days=settings.stale_task_days)
        
        # 장기간 업데이트되지 않은 진행중 작업들
        stale_tasks = self.session.exec(
            select(Task).where(
                Task.state == TaskState.IN_PROGRESS,
                Task.updated_at < stale_threshold
            )
        ).all()
        
        for task in stale_tasks:
            existing = self.session.exec(
                select(Notification).where(
                    Notification.task_id == task.id,
                    Notification.type == NotificationType.STALE_TASK,
                    Notification.status.in_([NotificationStatus.PENDING, NotificationStatus.SENT])
                )
            ).first()
            
            if not existing:
                days_stale = (now - task.updated_at).days
                notification = Notification(
                    type=NotificationType.STALE_TASK,
                    title=f"⏰ 장기 미진행: {task.title}",
                    message=f"작업 '{task.title}'이 {days_stale}일째 업데이트되지 않았습니다.",
                    task_id=task.id,
                    project_id=task.project_id,
                    scheduled_for=now
                )
                notifications.append(notification)
                
        return notifications
    
    def generate_review_schedule_notifications(self) -> List[Notification]:
        """정기 리뷰 스케줄 알림을 생성합니다."""
        settings = self.get_or_create_settings()
        if not settings.enable_review_reminders:
            return []
            
        notifications = []
        now = datetime.now(timezone.utc)
        
        # 최근 리뷰가 없는 진행중인 프로젝트들
        projects = self.session.exec(select(Project)).all()
        
        for project in projects:
            # 해당 프로젝트의 최근 리뷰 확인
            recent_review = self.session.exec(
                select(Review)
                .join(Task, Review.task_id == Task.id)
                .where(
                    Task.project_id == project.id,
                    Review.created_at > now - timedelta(days=settings.review_reminder_frequency_days)
                )
                .order_by(Review.created_at.desc())
            ).first()
            
            if not recent_review:
                existing = self.session.exec(
                    select(Notification).where(
                        Notification.project_id == project.id,
                        Notification.type == NotificationType.REVIEW_SCHEDULE,
                        Notification.status.in_([NotificationStatus.PENDING, NotificationStatus.SENT])
                    )
                ).first()
                
                if not existing:
                    notification = Notification(
                        type=NotificationType.REVIEW_SCHEDULE,
                        title=f"📋 정기 리뷰 필요: {project.name}",
                        message=f"프로젝트 '{project.name}'의 정기 리뷰를 진행해주세요.",
                        project_id=project.id,
                        scheduled_for=now
                    )
                    notifications.append(notification)
                    
        return notifications
    
    def generate_all_notifications(self) -> List[Notification]:
        """모든 타입의 알림을 생성합니다."""
        all_notifications = []
        
        all_notifications.extend(self.generate_due_date_notifications())
        all_notifications.extend(self.generate_missing_component_notifications())
        all_notifications.extend(self.generate_stale_task_notifications())
        all_notifications.extend(self.generate_review_schedule_notifications())
        
        # 데이터베이스에 저장
        for notification in all_notifications:
            self.session.add(notification)
        
        if all_notifications:
            self.session.commit()
            
        return all_notifications
    
    def get_pending_notifications(self) -> List[Notification]:
        """대기중인 알림들을 가져옵니다."""
        now = datetime.now(timezone.utc)
        return self.session.exec(
            select(Notification).where(
                Notification.status == NotificationStatus.PENDING,
                Notification.scheduled_for <= now
            ).order_by(Notification.scheduled_for.desc())
        ).all()
    
    def mark_notification_sent(self, notification_id: int):
        """알림을 발송됨으로 표시합니다."""
        notification = self.session.get(Notification, notification_id)
        if notification:
            notification.status = NotificationStatus.SENT
            notification.sent_at = datetime.now(timezone.utc)
            self.session.commit()
    
    def mark_notification_read(self, notification_id: int):
        """알림을 읽음으로 표시합니다."""
        notification = self.session.get(Notification, notification_id)
        if notification:
            notification.status = NotificationStatus.READ
            notification.read_at = datetime.now(timezone.utc)
            self.session.commit()
    
    def dismiss_notification(self, notification_id: int):
        """알림을 해제합니다."""
        notification = self.session.get(Notification, notification_id)
        if notification:
            notification.status = NotificationStatus.DISMISSED
            notification.dismissed_at = datetime.now(timezone.utc)
            self.session.commit()
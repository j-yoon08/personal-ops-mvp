from datetime import datetime, date, timezone
from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, JSON, event

class TaskState(str, Enum):
    BACKLOG = "BACKLOG"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    PAUSED = "PAUSED"
    CANCELED = "CANCELED"

class ReviewType(str, Enum):
    PREMORTEM = "PREMORTEM"
    MIDMORTEM = "MIDMORTEM"
    RETRO = "RETRO"

class NotificationType(str, Enum):
    DUE_DATE_REMINDER = "DUE_DATE_REMINDER"
    OVERDUE_TASK = "OVERDUE_TASK"
    MISSING_BRIEF = "MISSING_BRIEF"
    MISSING_DOD = "MISSING_DOD"
    STALE_TASK = "STALE_TASK"
    REVIEW_SCHEDULE = "REVIEW_SCHEDULE"

class NotificationStatus(str, Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    READ = "READ"
    DISMISSED = "DISMISSED"

class TemplateCategory(str, Enum):
    WEB_DEVELOPMENT = "WEB_DEVELOPMENT"
    MOBILE_APP = "MOBILE_APP"
    DATA_ANALYSIS = "DATA_ANALYSIS"
    RESEARCH = "RESEARCH"
    MARKETING = "MARKETING"
    DESIGN = "DESIGN"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    AUTOMATION = "AUTOMATION"
    CONTENT_CREATION = "CONTENT_CREATION"
    BUSINESS_STRATEGY = "BUSINESS_STRATEGY"
    GENERAL = "GENERAL"

class TemplateType(str, Enum):
    BRIEF = "BRIEF"  # 5SB 템플릿
    DOD = "DOD"      # DoD 템플릿
    PROJECT = "PROJECT"  # 전체 프로젝트 템플릿

class UserRole(str, Enum):
    OWNER = "OWNER"         # 프로젝트 소유자
    ADMIN = "ADMIN"         # 관리자 권한
    MEMBER = "MEMBER"       # 일반 멤버
    VIEWER = "VIEWER"       # 읽기 전용

class SharePermission(str, Enum):
    READ = "READ"           # 읽기 권한
    WRITE = "WRITE"         # 쓰기 권한
    ADMIN = "ADMIN"         # 관리 권한

class InviteStatus(str, Enum):
    PENDING = "PENDING"     # 대기 중
    ACCEPTED = "ACCEPTED"   # 수락됨
    REJECTED = "REJECTED"   # 거절됨
    EXPIRED = "EXPIRED"     # 만료됨

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"     # 승인 대기
    APPROVED = "APPROVED"   # 승인됨
    REJECTED = "REJECTED"   # 거절됨
    CANCELLED = "CANCELLED" # 취소됨

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    full_name: Optional[str] = None
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    owned_projects: List["Project"] = Relationship(back_populates="owner")
    project_memberships: List["ProjectMember"] = Relationship(back_populates="user")
    assigned_tasks: List["Task"] = Relationship(back_populates="assignee")
    sent_invites: List["ProjectInvite"] = Relationship(
        back_populates="invited_by",
        sa_relationship_kwargs={"foreign_keys": "[ProjectInvite.invited_by_id]"}
    )
    received_invites: List["ProjectInvite"] = Relationship(
        back_populates="invited_user",
        sa_relationship_kwargs={"foreign_keys": "[ProjectInvite.invited_user_id]"}
    )

class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    owner_id: int = Field(foreign_key="user.id", index=True)
    is_private: bool = Field(default=True)  # 비공개/공개 프로젝트
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    owner: Optional[User] = Relationship(back_populates="owned_projects")
    tasks: List["Task"] = Relationship(back_populates="project")
    members: List["ProjectMember"] = Relationship(back_populates="project")
    invites: List["ProjectInvite"] = Relationship(back_populates="project")
    approval_workflows: List["ApprovalWorkflow"] = Relationship(back_populates="project")

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    title: str
    state: TaskState = Field(default=TaskState.BACKLOG, index=True)
    priority: int = Field(default=3)  # 1 high - 5 low
    due_date: Optional[date] = Field(default=None, index=True)
    assignee_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)  # 담당자
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # metrics
    context_switch_count: int = Field(default=0)
    rework_count: int = Field(default=0)
    dod_checked: bool = Field(default=False)

    project: Optional[Project] = Relationship(back_populates="tasks")
    assignee: Optional[User] = Relationship(back_populates="assigned_tasks")
    brief: Optional["Brief"] = Relationship(
        back_populates="task",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "single_parent": True, "uselist": False},
    )
    dod: Optional["DoD"] = Relationship(
        back_populates="task",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "single_parent": True, "uselist": False},
    )
    reviews: List["Review"] = Relationship(
        back_populates="task",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "single_parent": True},
    )
    decision_logs: List["DecisionLog"] = Relationship(
        back_populates="task",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "single_parent": True},
    )
    samples: List["Sample"] = Relationship(
        back_populates="task",
        sa_relationship_kwargs={"cascade": "all, delete-orphan", "single_parent": True},
    )

class Brief(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id", index=True, unique=True)
    # 5SB
    purpose: str
    success_criteria: str
    constraints: str
    priority: str
    validation: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    task: Optional[Task] = Relationship(
        back_populates="brief",
        sa_relationship_kwargs={"uselist": False}
    )

class DoD(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id", index=True, unique=True)
    deliverable_formats: str  # e.g., "MD,PDF,PPTX"
    mandatory_checks: list[str] = Field(sa_column=Column(JSON))  # JSON array of mandatory checks
    quality_bar: str          # e.g., typo rate, length, examples, etc.
    verification: str         # e.g., sample n, review count
    deadline: Optional[date] = None
    version_tag: str = "v0.1"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    task: Optional[Task] = Relationship(
        back_populates="dod",
        sa_relationship_kwargs={"uselist": False}
    )

class DecisionLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    date: date
    problem: str
    options: str
    decision_reason: str
    assumptions_risks: str
    d_plus_7_review: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    task: Optional[Task] = Relationship(back_populates="decision_logs")

class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id")
    review_type: ReviewType
    positives: str
    negatives: str
    changes_next: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    task: Optional[Task] = Relationship(back_populates="reviews")

class Sample(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    task_id: int = Field(foreign_key="task.id", index=True)
    proportion: float = Field(default=0.1, ge=0.0, le=1.0)  # 10% rule with bounds
    notes: Optional[str] = None
    approved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    task: Optional[Task] = Relationship(back_populates="samples")

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: NotificationType
    title: str
    message: str
    status: NotificationStatus = Field(default=NotificationStatus.PENDING)
    
    # Optional task/project association
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    project_id: Optional[int] = Field(default=None, foreign_key="project.id")
    
    # Scheduling
    scheduled_for: datetime
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    task: Optional[Task] = Relationship()
    project: Optional[Project] = Relationship()

class NotificationSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Due date reminders
    due_date_reminder_days: int = Field(default=1)  # Days before due date
    enable_due_date_reminders: bool = Field(default=True)
    
    # Missing components alerts
    enable_missing_brief_alerts: bool = Field(default=True)
    enable_missing_dod_alerts: bool = Field(default=True)
    
    # Stale task detection
    stale_task_days: int = Field(default=7)  # Days without activity
    enable_stale_task_alerts: bool = Field(default=True)
    
    # Review schedule reminders
    enable_review_reminders: bool = Field(default=True)
    review_reminder_frequency_days: int = Field(default=7)  # Weekly reviews
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@event.listens_for(Task, "before_update", propagate=True)
def _task_timestamp_before_update(mapper, connection, target):
    # Auto-update the updated_at timestamp to UTC on any Task change
    target.updated_at = datetime.now(timezone.utc)

@event.listens_for(Notification, "before_update", propagate=True)
def _notification_timestamp_before_update(mapper, connection, target):
    # Auto-update the updated_at timestamp to UTC on any Notification change
    target.updated_at = datetime.now(timezone.utc)

class Template(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    category: TemplateCategory = Field(default=TemplateCategory.GENERAL)
    template_type: TemplateType
    
    # Template content (JSON structure)
    content: dict = Field(sa_column=Column(JSON))
    
    # Metadata
    is_system_template: bool = Field(default=False)  # 시스템 기본 템플릿
    is_ai_generated: bool = Field(default=False)     # AI 생성 템플릿
    source_project_id: Optional[int] = Field(default=None, foreign_key="project.id")  # 소스 프로젝트
    
    # Usage statistics
    usage_count: int = Field(default=0)
    success_rate: Optional[float] = Field(default=None)  # 성공률 (0.0-1.0)
    
    # Tags for better categorization
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    source_project: Optional[Project] = Relationship()

class TemplateUsage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    template_id: int = Field(foreign_key="template.id", index=True)
    project_id: Optional[int] = Field(default=None, foreign_key="project.id")
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    
    # Usage context
    used_for: str  # "project_creation", "task_creation", "brief_writing", etc.
    
    # Feedback
    was_helpful: Optional[bool] = None
    feedback_notes: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    template: Optional[Template] = Relationship()
    project: Optional[Project] = Relationship()
    task: Optional[Task] = Relationship()

class BestPractice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    category: TemplateCategory
    
    # Best practice content
    principles: List[str] = Field(sa_column=Column(JSON))  # 핵심 원칙들
    do_list: List[str] = Field(sa_column=Column(JSON))     # 해야 할 것들
    dont_list: List[str] = Field(sa_column=Column(JSON))   # 하지 말아야 할 것들
    examples: List[str] = Field(sa_column=Column(JSON))    # 예시들
    
    # Metadata
    source: str = Field(default="internal")  # "internal", "industry", "research"
    confidence_score: float = Field(default=0.8)  # 신뢰도 (0.0-1.0)
    
    # Tags
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@event.listens_for(Task, "before_update", propagate=True)
def _task_timestamp_before_update(mapper, connection, target):
    # Auto-update the updated_at timestamp to UTC on any Task change
    target.updated_at = datetime.now(timezone.utc)

@event.listens_for(Notification, "before_update", propagate=True)
def _notification_timestamp_before_update(mapper, connection, target):
    # Auto-update the updated_at timestamp to UTC on any Notification change
    target.updated_at = datetime.now(timezone.utc)

@event.listens_for(NotificationSettings, "before_update", propagate=True) 
def _notification_settings_timestamp_before_update(mapper, connection, target):
    # Auto-update the updated_at timestamp to UTC on any NotificationSettings change
    target.updated_at = datetime.now(timezone.utc)

@event.listens_for(Template, "before_update", propagate=True)
def _template_timestamp_before_update(mapper, connection, target):
    # Auto-update the updated_at timestamp to UTC on any Template change
    target.updated_at = datetime.now(timezone.utc)

@event.listens_for(BestPractice, "before_update", propagate=True)
def _best_practice_timestamp_before_update(mapper, connection, target):
    # Auto-update the updated_at timestamp to UTC on any BestPractice change
    target.updated_at = datetime.now(timezone.utc)

# 협업 기능 모델들
class ProjectMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    role: UserRole = Field(default=UserRole.MEMBER)
    permissions: SharePermission = Field(default=SharePermission.READ)
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    project: Optional[Project] = Relationship(back_populates="members")
    user: Optional[User] = Relationship(back_populates="project_memberships")

class ProjectInvite(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    invited_by_id: int = Field(foreign_key="user.id", index=True)
    invited_user_id: Optional[int] = Field(default=None, foreign_key="user.id")  # 등록된 사용자
    invited_email: Optional[str] = None  # 미등록 사용자
    role: UserRole = Field(default=UserRole.MEMBER)
    permissions: SharePermission = Field(default=SharePermission.READ)
    status: InviteStatus = Field(default=InviteStatus.PENDING)
    invite_token: str = Field(unique=True)  # 초대 링크용 토큰
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    responded_at: Optional[datetime] = None
    
    # Relationships
    project: Optional[Project] = Relationship(back_populates="invites")
    invited_by: Optional[User] = Relationship(
        back_populates="sent_invites",
        sa_relationship_kwargs={"foreign_keys": "[ProjectInvite.invited_by_id]"}
    )
    invited_user: Optional[User] = Relationship(
        back_populates="received_invites",
        sa_relationship_kwargs={"foreign_keys": "[ProjectInvite.invited_user_id]"}
    )

class ApprovalWorkflow(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    decision_id: Optional[int] = Field(default=None, foreign_key="decisionlog.id")
    
    title: str
    description: str
    requested_by_id: int = Field(foreign_key="user.id")
    
    # 승인 설정
    required_approvers: int = Field(default=1)  # 필요한 승인자 수
    approver_user_ids: List[int] = Field(sa_column=Column(JSON))  # 승인자 목록
    
    status: ApprovalStatus = Field(default=ApprovalStatus.PENDING)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    
    # Relationships
    project: Optional[Project] = Relationship(back_populates="approval_workflows")
    task: Optional[Task] = Relationship()
    decision: Optional[DecisionLog] = Relationship()
    requested_by: Optional[User] = Relationship()
    approvals: List["ApprovalResponse"] = Relationship(back_populates="workflow")

class ApprovalResponse(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    workflow_id: int = Field(foreign_key="approvalworkflow.id", index=True)
    approver_id: int = Field(foreign_key="user.id", index=True)
    
    is_approved: bool  # True: 승인, False: 거절
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    workflow: Optional[ApprovalWorkflow] = Relationship(back_populates="approvals")
    approver: Optional[User] = Relationship()

class TeamDecision(SQLModel, table=True):
    """팀 의사결정을 위한 별도 모델"""
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(foreign_key="project.id", index=True)
    task_id: Optional[int] = Field(default=None, foreign_key="task.id")
    
    title: str
    description: str
    options: List[str] = Field(sa_column=Column(JSON))  # 선택 옵션들
    
    # 투표 설정
    is_voting_enabled: bool = Field(default=False)
    voting_deadline: Optional[datetime] = None
    allow_multiple_votes: bool = Field(default=False)
    
    # 의사결정 상태
    is_concluded: bool = Field(default=False)
    final_decision: Optional[str] = None
    decision_rationale: Optional[str] = None
    
    created_by_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    concluded_at: Optional[datetime] = None
    
    # Relationships
    project: Optional[Project] = Relationship()
    task: Optional[Task] = Relationship()
    created_by: Optional[User] = Relationship()
    votes: List["DecisionVote"] = Relationship(back_populates="decision")
    comments: List["DecisionComment"] = Relationship(back_populates="decision")

class DecisionVote(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    decision_id: int = Field(foreign_key="teamdecision.id", index=True)
    voter_id: int = Field(foreign_key="user.id", index=True)
    
    selected_options: List[str] = Field(sa_column=Column(JSON))  # 선택한 옵션들
    reasoning: Optional[str] = None  # 투표 이유
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    decision: Optional[TeamDecision] = Relationship(back_populates="votes")
    voter: Optional[User] = Relationship()

class DecisionComment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    decision_id: int = Field(foreign_key="teamdecision.id", index=True)
    author_id: int = Field(foreign_key="user.id", index=True)
    
    content: str
    parent_comment_id: Optional[int] = Field(default=None, foreign_key="decisioncomment.id")  # 댓글의 댓글
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    decision: Optional[TeamDecision] = Relationship(back_populates="comments")
    author: Optional[User] = Relationship()
    parent_comment: Optional["DecisionComment"] = Relationship()
    replies: List["DecisionComment"] = Relationship()

# 협업 모델용 이벤트 리스너들
@event.listens_for(DecisionVote, "before_update", propagate=True)
def _decision_vote_timestamp_before_update(mapper, connection, target):
    target.updated_at = datetime.now(timezone.utc)

@event.listens_for(DecisionComment, "before_update", propagate=True)
def _decision_comment_timestamp_before_update(mapper, connection, target):
    target.updated_at = datetime.now(timezone.utc)

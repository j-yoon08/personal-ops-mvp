from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field, constr
from .models import TaskState, ReviewType

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: str
    class Config: from_attributes = True

class ProjectWithStats(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: str
    task_count: int
    class Config: from_attributes = True

class TaskCreate(BaseModel):
    project_id: int
    title: str
    priority: int = 3
    due_date: Optional[date] = None

class TaskRead(BaseModel):
    id: int
    project_id: int
    title: str
    state: TaskState
    priority: int
    due_date: Optional[date] = None
    assignee_id: Optional[int] = None
    dod_checked: bool
    created_at: datetime
    updated_at: datetime
    context_switch_count: int
    rework_count: int
    class Config: from_attributes = True

class TaskUpdateState(BaseModel):
    state: TaskState


# General task update schema
class TaskUpdate(BaseModel):
    title: Optional[constr(min_length=1)] = None
    priority: Optional[int] = Field(default=None, ge=1, le=5)
    due_date: Optional[date] = None


class BriefBase(BaseModel):
    purpose: constr(min_length=1)
    success_criteria: constr(min_length=1)
    constraints: constr(min_length=1)
    priority: constr(min_length=1)
    validation: constr(min_length=1)

class BriefCreate(BriefBase):
    task_id: int

class BriefUpdate(BaseModel):
    purpose: Optional[constr(min_length=1)] = None
    success_criteria: Optional[constr(min_length=1)] = None
    constraints: Optional[constr(min_length=1)] = None
    priority: Optional[constr(min_length=1)] = None
    validation: Optional[constr(min_length=1)] = None

class BriefRead(BriefBase):
    id: int
    task_id: int
    created_at: datetime
    class Config: from_attributes = True

class DoDCreate(BaseModel):
    task_id: int
    deliverable_formats: str
    mandatory_checks: List[str]
    quality_bar: str
    verification: str
    deadline: Optional[date] = None
    version_tag: str = "v0.1"

class DecisionLogCreate(BaseModel):
    task_id: int
    date: date
    problem: str
    options: str
    decision_reason: str
    assumptions_risks: str

class DecisionLogReviewUpdate(BaseModel):
    d_plus_7_review: str

class ReviewCreate(BaseModel):
    task_id: int
    review_type: ReviewType
    positives: str
    negatives: str
    changes_next: str

class SampleCreate(BaseModel):
    task_id: int
    proportion: float = Field(default=0.1, ge=0.0, le=1.0)
    notes: Optional[str] = None
    approved: bool = False

class KPIRead(BaseModel):
    rework_rate: float
    context_switches_per_day: float
    dod_adherence: float
    sample_validation_rate: float
    brief_completion_rate: float

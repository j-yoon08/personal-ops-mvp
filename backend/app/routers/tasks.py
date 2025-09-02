from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy import func
from app.db.session import get_session
from app.core.config import settings
from app.models import Task, Project, TaskState
from app.schemas import TaskCreate, TaskRead, TaskUpdateState, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])

def _wip_count(session: Session) -> int:
    result = session.exec(
        select(func.count()).select_from(Task).where(Task.state == TaskState.IN_PROGRESS)).one()
    return int(result[0] if isinstance(result, tuple) else result)

@router.post("", response_model=TaskRead)
def create_task(payload: TaskCreate, session: Session = Depends(get_session)):
    project = session.get(Project, payload.project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    t = Task(
        project_id=payload.project_id, 
        title=payload.title, 
        priority=payload.priority, 
        due_date=payload.due_date,
        assignee_id=1  # 임시로 하드코딩
    )
    session.add(t); session.commit(); session.refresh(t)
    return t

@router.get("", response_model=list[TaskRead])
def list_tasks(project_id: int = None, session: Session = Depends(get_session)):
    query = select(Task)
    if project_id:
        query = query.where(Task.project_id == project_id)
    return session.exec(query).all()

@router.get("/{task_id}", response_model=TaskRead)
def get_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    return task

@router.patch("/{task_id}/state", response_model=TaskRead)
def update_state(task_id: int, payload: TaskUpdateState, session: Session = Depends(get_session)):
    t = session.get(Task, task_id)
    if not t:
        raise HTTPException(404, "Task not found")
    if payload.state == TaskState.IN_PROGRESS and _wip_count(session) >= settings.WIP_LIMIT:
        raise HTTPException(400, f"WIP limit exceeded (limit={settings.WIP_LIMIT})")
    t.state = payload.state
    session.add(t)
    session.commit()
    session.refresh(t)
    return t

@router.patch("/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    if payload.title is not None:
        task.title = payload.title
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.due_date is not None:
        task.due_date = payload.due_date
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(task_id: int, session: Session = Depends(get_session)):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    session.delete(task); session.commit()
    return {"message": "Task deleted"}

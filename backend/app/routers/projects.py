from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from app.db.session import get_session
from app.models import Project, Task
from app.schemas import ProjectCreate, ProjectRead, ProjectWithStats

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectRead)
def create_project(payload: ProjectCreate, session: Session = Depends(get_session)):
    # 기본 사용자 ID를 1로 설정 (실제로는 인증에서 가져와야 함)
    p = Project(
        name=payload.name, 
        description=payload.description,
        owner_id=1  # 임시로 하드코딩
    )
    session.add(p)
    session.commit() 
    session.refresh(p)
    
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "created_at": p.created_at.isoformat()
    }

@router.get("", response_model=list[ProjectWithStats])
def list_projects(session: Session = Depends(get_session)):
    # 프로젝트와 작업 수를 함께 조회
    query = (
        select(
            Project.id,
            Project.name,
            Project.description,
            Project.created_at,
            func.count(Task.id).label("task_count")
        )
        .select_from(Project)
        .outerjoin(Task, Project.id == Task.project_id)
        .group_by(Project.id, Project.name, Project.description, Project.created_at)
    )
    
    results = session.exec(query).all()
    
    return [
        {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "created_at": row[3].isoformat(),
            "task_count": row[4]
        }
        for row in results
    ]

@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat()
    }

@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectCreate, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    session.add(project); session.commit(); session.refresh(project)
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "created_at": project.created_at.isoformat()
    }

@router.delete("/{project_id}")
def delete_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    
    # 먼저 해당 프로젝트의 모든 작업들을 삭제
    tasks = session.exec(select(Task).where(Task.project_id == project_id)).all()
    for task in tasks:
        session.delete(task)
    
    # 그 다음 프로젝트 삭제
    session.delete(project)
    session.commit()
    return {"message": "Project deleted"}

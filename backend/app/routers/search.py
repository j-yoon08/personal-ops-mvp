from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.db.session import get_session
from app.services.search import SearchService
from app.models import Project

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/")
def unified_search(
    q: str = Query(..., description="검색어", min_length=2),
    types: Optional[List[str]] = Query(
        None, 
        description="검색할 콘텐츠 타입",
        regex="^(projects|tasks|briefs|dod|decisions|reviews)$"
    ),
    limit: int = Query(50, description="결과 제한 수", ge=1, le=200),
    session: Session = Depends(get_session)
):
    """
    통합 검색 API
    
    모든 콘텐츠 타입에서 통합 검색을 수행합니다.
    
    - **q**: 검색어 (최소 2글자)
    - **types**: 검색할 콘텐츠 타입 리스트 (기본값: 전체)
    - **limit**: 결과 제한 수 (기본값: 50)
    """
    service = SearchService(session)
    return service.unified_search(q, types, limit)

@router.get("/similar-projects/{project_id}")
def find_similar_projects(
    project_id: int,
    limit: int = Query(5, description="결과 제한 수", ge=1, le=20),
    session: Session = Depends(get_session)
):
    """
    유사한 프로젝트 찾기
    
    현재 프로젝트와 유사한 과거 프로젝트들을 찾습니다.
    
    - **project_id**: 기준 프로젝트 ID
    - **limit**: 결과 제한 수 (기본값: 5)
    """
    service = SearchService(session)
    return {
        "project_id": project_id,
        "similar_projects": service.find_similar_projects(project_id, limit)
    }

@router.get("/decision-patterns")
def get_decision_patterns(
    q: str = Query(..., description="문제 상황 검색어", min_length=3),
    limit: int = Query(10, description="결과 제한 수", ge=1, le=50),
    session: Session = Depends(get_session)
):
    """
    의사결정 패턴 분석
    
    유사한 문제 상황에 대한 과거 의사결정 패턴을 분석합니다.
    
    - **q**: 문제 상황 검색어
    - **limit**: 결과 제한 수 (기본값: 10)
    """
    service = SearchService(session)
    return {
        "query": q,
        "decision_patterns": service.get_decision_patterns(q, limit)
    }

@router.get("/suggestions/{project_id}")
def get_project_suggestions(
    project_id: int,
    session: Session = Depends(get_session)
):
    """
    프로젝트별 제안사항
    
    현재 프로젝트를 기반으로 다양한 제안사항을 제공합니다:
    - 유사한 과거 프로젝트
    - 관련 의사결정 패턴
    - 추천 작업 구조
    """
    service = SearchService(session)
    
    # 현재 프로젝트 정보 가져오기
    project = session.get(Project, project_id)
    if not project:
        return {"error": "프로젝트를 찾을 수 없습니다"}
    
    # 유사한 프로젝트 찾기
    similar_projects = service.find_similar_projects(project_id, 5)
    
    # 프로젝트명 기반 의사결정 패턴 찾기 (프로젝트명의 키워드 사용)
    keywords = " ".join(project.name.split()[:3])  # 프로젝트명에서 처음 3단어
    decision_patterns = service.get_decision_patterns(keywords, 5) if len(keywords) >= 3 else []
    
    return {
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description
        },
        "suggestions": {
            "similar_projects": similar_projects,
            "related_decisions": decision_patterns,
            "recommendations": [
                "유사한 과거 프로젝트의 성공 패턴을 참고하세요",
                "관련 의사결정 사례를 검토하여 리스크를 미리 파악하세요",
                "5SB와 DoD를 명확히 정의하여 프로젝트 성공률을 높이세요"
            ]
        }
    }

@router.get("/stats")
def get_search_stats(session: Session = Depends(get_session)):
    """
    검색 가능한 콘텐츠 통계
    
    시스템 내 검색 가능한 콘텐츠의 현황을 제공합니다.
    """
    service = SearchService(session)
    summary = service.get_content_summary()
    
    return {
        "content_summary": summary,
        "search_capabilities": {
            "unified_search": "모든 콘텐츠 타입에서 통합 검색",
            "similar_projects": "과거 프로젝트와의 유사도 분석",
            "decision_patterns": "의사결정 히스토리 기반 패턴 분석",
            "project_suggestions": "프로젝트별 맞춤 제안사항"
        },
        "supported_content_types": [
            {"type": "projects", "description": "프로젝트 (이름, 설명)"},
            {"type": "tasks", "description": "작업 (제목)"},
            {"type": "briefs", "description": "5문장 브리프 (목적, 성공기준, 제약조건 등)"},
            {"type": "dod", "description": "완료 정의 (품질 기준, 검증 방법 등)"},
            {"type": "decisions", "description": "의사결정 (문제, 옵션, 결정 사유 등)"},
            {"type": "reviews", "description": "리뷰 (긍정/부정 사항, 개선점 등)"}
        ]
    }
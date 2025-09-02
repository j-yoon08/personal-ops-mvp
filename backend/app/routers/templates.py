from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.db.session import get_session
from app.services.templates import TemplateService
from app.models import Template, BestPractice, TemplateCategory, TemplateType, Project

router = APIRouter(prefix="/templates", tags=["templates"])

@router.post("/init-system-templates")
def initialize_system_templates(session: Session = Depends(get_session)):
    """시스템 기본 템플릿 초기화"""
    service = TemplateService(session)
    service.create_system_templates()
    return {"message": "시스템 템플릿이 초기화되었습니다."}

@router.get("/")
def get_templates(
    category: Optional[TemplateCategory] = Query(None, description="템플릿 카테고리"),
    template_type: Optional[TemplateType] = Query(None, description="템플릿 타입"),
    include_system: bool = Query(True, description="시스템 템플릿 포함 여부"),
    include_ai: bool = Query(True, description="AI 생성 템플릿 포함 여부"),
    limit: int = Query(50, description="결과 제한 수", ge=1, le=200),
    session: Session = Depends(get_session)
):
    """템플릿 목록 조회"""
    service = TemplateService(session)
    templates = service.get_templates(category, template_type, include_system, include_ai, limit)
    
    return {
        "templates": [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "category": t.category,
                "template_type": t.template_type,
                "content": t.content,
                "is_system_template": t.is_system_template,
                "is_ai_generated": t.is_ai_generated,
                "usage_count": t.usage_count,
                "success_rate": t.success_rate,
                "tags": t.tags,
                "created_at": t.created_at.isoformat(),
                "source_project_id": t.source_project_id
            }
            for t in templates
        ],
        "total": len(templates)
    }

@router.get("/recommend")
def get_recommended_templates(
    keywords: str = Query(..., description="프로젝트 키워드 (쉼표로 구분)", min_length=2),
    limit: int = Query(5, description="추천 템플릿 수", ge=1, le=20),
    session: Session = Depends(get_session)
):
    """키워드 기반 템플릿 추천"""
    service = TemplateService(session)
    keyword_list = [k.strip() for k in keywords.split(",") if k.strip()]
    
    if not keyword_list:
        raise HTTPException(status_code=400, detail="최소 하나의 키워드가 필요합니다.")
    
    recommendations = service.get_recommended_templates(keyword_list, limit)
    
    return {
        "keywords": keyword_list,
        "recommendations": [
            {
                "template": {
                    "id": rec["template"].id,
                    "name": rec["template"].name,
                    "description": rec["template"].description,
                    "category": rec["template"].category,
                    "template_type": rec["template"].template_type,
                    "content": rec["template"].content,
                    "usage_count": rec["template"].usage_count,
                    "success_rate": rec["template"].success_rate,
                    "tags": rec["template"].tags,
                    "is_system_template": rec["template"].is_system_template,
                    "is_ai_generated": rec["template"].is_ai_generated,
                },
                "relevance_score": rec["relevance_score"],
                "match_reasons": rec["match_reasons"]
            }
            for rec in recommendations
        ]
    }

@router.get("/{template_id}")
def get_template(
    template_id: int,
    session: Session = Depends(get_session)
):
    """특정 템플릿 상세 조회"""
    template = session.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다.")
    
    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "category": template.category,
        "template_type": template.template_type,
        "content": template.content,
        "is_system_template": template.is_system_template,
        "is_ai_generated": template.is_ai_generated,
        "usage_count": template.usage_count,
        "success_rate": template.success_rate,
        "tags": template.tags,
        "created_at": template.created_at.isoformat(),
        "updated_at": template.updated_at.isoformat(),
        "source_project_id": template.source_project_id
    }

@router.post("/generate-from-project/{project_id}")
def generate_template_from_project(
    project_id: int,
    session: Session = Depends(get_session)
):
    """성공한 프로젝트에서 템플릿 자동 생성"""
    service = TemplateService(session)
    
    # 프로젝트 존재 확인
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    
    template_data = service.generate_template_from_success_project(project_id)
    
    if not template_data:
        raise HTTPException(
            status_code=400, 
            detail="템플릿 생성 조건을 만족하지 않습니다. (완료율 80% 이상, Brief/DoD 존재 필요)"
        )
    
    result = {
        "message": f"프로젝트 '{project.name}'에서 템플릿이 생성되었습니다.",
        "generated_templates": []
    }
    
    if "brief_template" in template_data:
        brief_template = template_data["brief_template"]
        result["generated_templates"].append({
            "id": brief_template.id,
            "name": brief_template.name,
            "type": "BRIEF",
            "success_rate": brief_template.success_rate
        })
    
    if "dod_template" in template_data:
        dod_template = template_data["dod_template"]
        result["generated_templates"].append({
            "id": dod_template.id,
            "name": dod_template.name,
            "type": "DOD",
            "success_rate": dod_template.success_rate
        })
    
    return result

@router.post("/{template_id}/use")
def record_template_usage(
    template_id: int,
    usage_data: dict,
    session: Session = Depends(get_session)
):
    """템플릿 사용 기록"""
    template = session.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="템플릿을 찾을 수 없습니다.")
    
    service = TemplateService(session)
    service.record_template_usage(
        template_id=template_id,
        used_for=usage_data.get("used_for", "unknown"),
        project_id=usage_data.get("project_id"),
        task_id=usage_data.get("task_id")
    )
    
    return {"message": "템플릿 사용이 기록되었습니다."}

@router.get("/categories/stats")
def get_template_categories():
    """템플릿 카테고리 목록 및 설명"""
    categories = [
        {
            "value": TemplateCategory.WEB_DEVELOPMENT,
            "label": "웹 개발",
            "description": "웹사이트, 웹 애플리케이션 개발 프로젝트"
        },
        {
            "value": TemplateCategory.MOBILE_APP,
            "label": "모바일 앱",
            "description": "iOS, Android 모바일 애플리케이션 개발"
        },
        {
            "value": TemplateCategory.DATA_ANALYSIS,
            "label": "데이터 분석",
            "description": "데이터 분석, 머신러닝, 비즈니스 인텔리전스"
        },
        {
            "value": TemplateCategory.RESEARCH,
            "label": "연구",
            "description": "학술 연구, 시장 조사, 사용자 리서치"
        },
        {
            "value": TemplateCategory.MARKETING,
            "label": "마케팅",
            "description": "마케팅 캠페인, 브랜딩, 프로모션"
        },
        {
            "value": TemplateCategory.DESIGN,
            "label": "디자인",
            "description": "UI/UX 디자인, 그래픽 디자인, 브랜드 디자인"
        },
        {
            "value": TemplateCategory.INFRASTRUCTURE,
            "label": "인프라",
            "description": "서버, 클라우드, 네트워크 인프라 구축"
        },
        {
            "value": TemplateCategory.AUTOMATION,
            "label": "자동화",
            "description": "업무 자동화, 스크립팅, 봇 개발"
        },
        {
            "value": TemplateCategory.CONTENT_CREATION,
            "label": "콘텐츠 제작",
            "description": "블로그, 영상, 교육 콘텐츠 제작"
        },
        {
            "value": TemplateCategory.BUSINESS_STRATEGY,
            "label": "비즈니스 전략",
            "description": "사업 기획, 전략 수립, 프로세스 개선"
        },
        {
            "value": TemplateCategory.GENERAL,
            "label": "일반",
            "description": "일반적인 프로젝트 및 기타 업무"
        }
    ]
    
    return {"categories": categories}

@router.get("/best-practices/")
def get_best_practices(
    category: Optional[TemplateCategory] = Query(None, description="카테고리별 필터"),
    limit: int = Query(20, description="결과 제한 수", ge=1, le=100),
    session: Session = Depends(get_session)
):
    """베스트 프랙티스 조회"""
    service = TemplateService(session)
    practices = service.get_best_practices(category, limit)
    
    return {
        "best_practices": [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "category": p.category,
                "principles": p.principles,
                "do_list": p.do_list,
                "dont_list": p.dont_list,
                "examples": p.examples,
                "source": p.source,
                "confidence_score": p.confidence_score,
                "tags": p.tags,
                "created_at": p.created_at.isoformat()
            }
            for p in practices
        ],
        "total": len(practices)
    }

@router.get("/stats/overview")
def get_template_stats(session: Session = Depends(get_session)):
    """템플릿 통계 및 현황"""
    service = TemplateService(session)
    stats = service.get_template_stats()
    
    return {
        "template_stats": stats,
        "summary": {
            "total_templates": stats["total_templates"],
            "system_provided": stats["system_templates"],
            "ai_generated": stats["ai_generated_templates"],
            "user_created": stats["user_templates"],
            "categories_covered": len([k for k, v in stats["category_distribution"].items() if v > 0])
        }
    }
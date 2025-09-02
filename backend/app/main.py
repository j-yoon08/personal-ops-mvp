from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import init, get_session
from app.routers import projects, tasks, briefs, dod, decisions, reviews, samples, exports, dashboard, notifications, search, templates, collaboration

def create_app():
    app = FastAPI(
        title=settings.APP_NAME,
        description="개인 업무 관리 시스템 - WIP 제한, 5SB, DoD, KPI 대시보드",
        version="1.0.0"
    )
    
    # CORS 설정 - 환경별로 분리
    if settings.ENVIRONMENT == "development":
        allow_origins = ["*"]  # 개발 시에만 모든 도메인 허용
    else:
        allow_origins = settings.ALLOWED_ORIGINS  # 프로덕션에서는 제한
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
    )
    
    # 루트 경로 추가
    @app.get("/")
    def root():
        return {
            "message": "Personal Ops MVP API",
            "version": "1.0.0",
            "docs": "/docs",
            "redoc": "/redoc",
            "endpoints": {
                "projects": "/projects",
                "tasks": "/tasks", 
                "briefs": "/briefs",
                "dod": "/dod",
                "decisions": "/decisions",
                "reviews": "/reviews",
                "samples": "/samples",
                "dashboard": "/dashboard/kpi",
                "exports": "/exports",
                "notifications": "/notifications",
                "search": "/search",
                "templates": "/templates",
                "collaboration": "/collaboration"
            }
        }
    
    # 라우터들 등록
    app.include_router(projects.router)
    app.include_router(tasks.router)
    app.include_router(briefs.router)
    app.include_router(dod.router)
    app.include_router(decisions.router)
    app.include_router(reviews.router)
    app.include_router(samples.router)
    app.include_router(exports.router)
    app.include_router(dashboard.router)
    app.include_router(notifications.router)
    app.include_router(search.router)
    app.include_router(templates.router)
    app.include_router(collaboration.router)
    
    return app

app = create_app()
init()

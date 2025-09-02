#!/usr/bin/env python3
"""
초기 샘플 데이터 생성 스크립트
"""
import os
import sys
from datetime import datetime, date, timezone, timedelta

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, create_engine
from app.models import *
from app.core.config import settings

def create_sample_data():
    engine = create_engine(settings.DATABASE_URL, echo=True)
    
    # 모든 테이블 생성
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # 1. 기본 사용자 생성
        user = User(
            username="admin",
            email="admin@personalops.com",
            full_name="관리자"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # 2. 샘플 프로젝트 생성
        projects_data = [
            {
                "name": "개인 업무 관리 시스템 개발",
                "description": "WIP 제한, 5SB, DoD를 활용한 개인 업무 효율성 향상 시스템"
            },
            {
                "name": "데이터 분석 대시보드",
                "description": "업무 KPI 및 메트릭 시각화 프로젝트"
            },
            {
                "name": "자동화 도구 개발",
                "description": "반복 업무 자동화를 위한 스크립트 및 도구 개발"
            }
        ]
        
        projects = []
        for proj_data in projects_data:
            project = Project(
                name=proj_data["name"],
                description=proj_data["description"],
                owner_id=user.id,
                is_private=False
            )
            session.add(project)
            projects.append(project)
        
        session.commit()
        for project in projects:
            session.refresh(project)
        
        # 3. 샘플 작업 생성
        tasks_data = [
            {
                "title": "FastAPI 백엔드 구현",
                "state": TaskState.IN_PROGRESS,
                "priority": 1,
                "project_idx": 0,
                "due_date": date.today() + timedelta(days=7)
            },
            {
                "title": "React 프론트엔드 개발",
                "state": TaskState.BACKLOG,
                "priority": 2,
                "project_idx": 0,
                "due_date": date.today() + timedelta(days=14)
            },
            {
                "title": "KPI 메트릭 설계",
                "state": TaskState.DONE,
                "priority": 1,
                "project_idx": 1,
                "due_date": date.today() - timedelta(days=3)
            },
            {
                "title": "차트 컴포넌트 구현",
                "state": TaskState.BACKLOG,
                "priority": 3,
                "project_idx": 1,
                "due_date": date.today() + timedelta(days=10)
            },
            {
                "title": "배포 자동화 스크립트",
                "state": TaskState.PAUSED,
                "priority": 2,
                "project_idx": 2,
                "due_date": date.today() + timedelta(days=21)
            }
        ]
        
        tasks = []
        for task_data in tasks_data:
            task = Task(
                title=task_data["title"],
                project_id=projects[task_data["project_idx"]].id,
                state=task_data["state"],
                priority=task_data["priority"],
                assignee_id=user.id,
                due_date=task_data["due_date"]
            )
            session.add(task)
            tasks.append(task)
        
        session.commit()
        for task in tasks:
            session.refresh(task)
        
        # 4. 5SB Brief 샘플 데이터
        briefs_data = [
            {
                "task_idx": 0,
                "purpose": "사용자가 개인 업무를 효율적으로 관리할 수 있는 웹 애플리케이션 백엔드 구현",
                "success_criteria": "RESTful API 완성, 데이터베이스 연동, 프론트엔드와 통신 가능",
                "constraints": "FastAPI 사용, SQLite DB, 2주 내 완료",
                "priority": "높음 - 전체 시스템의 핵심 기능",
                "validation": "API 문서 생성, 단위 테스트 작성, 프론트엔드 연동 테스트"
            },
            {
                "task_idx": 2,
                "purpose": "업무 성과를 측정할 수 있는 핵심 지표 정의 및 계산 로직 설계",
                "success_criteria": "재작업율, 컨텍스트 스위치, DoD 준수율 등 5개 이상 메트릭 정의",
                "constraints": "기존 데이터 모델과 호환, 실시간 계산 가능",
                "priority": "중간 - 대시보드 개발 전 필수",
                "validation": "메트릭 공식 검증, 샘플 데이터로 계산 테스트"
            }
        ]
        
        for brief_data in briefs_data:
            brief = Brief(
                task_id=tasks[brief_data["task_idx"]].id,
                purpose=brief_data["purpose"],
                success_criteria=brief_data["success_criteria"],
                constraints=brief_data["constraints"],
                priority=brief_data["priority"],
                validation=brief_data["validation"]
            )
            session.add(brief)
        
        # 5. DoD 샘플 데이터
        dods_data = [
            {
                "task_idx": 0,
                "deliverable_formats": "Python코드,API문서,테스트코드",
                "mandatory_checks": [
                    "모든 엔드포인트 테스트 통과",
                    "API 문서 자동 생성",
                    "코드 커버리지 80% 이상",
                    "타입 힌트 완전 적용",
                    "보안 취약점 체크"
                ],
                "quality_bar": "PEP8 준수, 함수당 최대 20줄, 클래스당 최대 200줄",
                "verification": "코드 리뷰 1회, 통합 테스트 실행",
                "version_tag": "v1.0"
            },
            {
                "task_idx": 2,
                "deliverable_formats": "설계문서,계산공식,검증결과",
                "mandatory_checks": [
                    "모든 메트릭 공식 문서화",
                    "샘플 데이터로 계산 검증",
                    "성능 임계값 정의",
                    "대시보드 요구사항 매핑"
                ],
                "quality_bar": "수식 정확도 100%, 계산 시간 1초 이내",
                "verification": "동료 검토 1회, 실제 데이터 검증",
                "version_tag": "v1.0"
            }
        ]
        
        for dod_data in dods_data:
            dod = DoD(
                task_id=tasks[dod_data["task_idx"]].id,
                deliverable_formats=dod_data["deliverable_formats"],
                mandatory_checks=dod_data["mandatory_checks"],
                quality_bar=dod_data["quality_bar"],
                verification=dod_data["verification"],
                version_tag=dod_data["version_tag"],
                deadline=tasks[dod_data["task_idx"]].due_date
            )
            session.add(dod)
        
        # 6. 템플릿 데이터
        templates_data = [
            {
                "name": "웹 개발 5SB 템플릿",
                "category": TemplateCategory.WEB_DEVELOPMENT,
                "template_type": TemplateType.BRIEF,
                "content": {
                    "purpose_template": "사용자가 [기능]을 통해 [가치]를 얻을 수 있도록 [시스템] 구현",
                    "success_criteria_template": "[측정가능한 결과], [품질 기준], [성능 기준]",
                    "constraints_template": "[기술 스택], [시간 제약], [리소스 제약]",
                    "priority_template": "[높음/중간/낮음] - [이유]",
                    "validation_template": "[테스트 방법], [검증 기준], [승인 절차]"
                },
                "tags": ["web", "frontend", "backend"]
            },
            {
                "name": "기본 DoD 템플릿", 
                "category": TemplateCategory.GENERAL,
                "template_type": TemplateType.DOD,
                "content": {
                    "deliverable_formats": ["문서", "코드", "테스트"],
                    "mandatory_checks": [
                        "요구사항 충족 확인",
                        "품질 기준 통과",
                        "테스트 완료",
                        "문서화 완료"
                    ],
                    "quality_bar": "오타 없음, 일관된 스타일, 명확한 구조",
                    "verification": "동료 검토 1회, 최종 검증"
                },
                "tags": ["general", "quality"]
            }
        ]
        
        for template_data in templates_data:
            template = Template(
                name=template_data["name"],
                category=template_data["category"],
                template_type=template_data["template_type"],
                content=template_data["content"],
                is_system_template=True,
                tags=template_data["tags"]
            )
            session.add(template)
        
        # 7. 리뷰 데이터
        review = Review(
            task_id=tasks[2].id,  # 완료된 작업
            review_type=ReviewType.RETRO,
            positives="명확한 요구사항 정의, 체계적인 접근",
            negatives="초기 설계 시간이 부족했음",
            changes_next="다음에는 설계에 더 많은 시간 투자"
        )
        session.add(review)
        
        # 8. 알림 설정
        notification_settings = NotificationSettings()
        session.add(notification_settings)
        
        # 9. 샘플 알림
        notifications_data = [
            {
                "type": NotificationType.DUE_DATE_REMINDER,
                "title": "작업 마감일 알림",
                "message": f"'{tasks[0].title}' 작업이 7일 후 마감됩니다.",
                "task_id": tasks[0].id,
                "scheduled_for": datetime.now(timezone.utc) + timedelta(hours=1)
            },
            {
                "type": NotificationType.MISSING_BRIEF,
                "title": "5SB 작성 필요",
                "message": f"'{tasks[1].title}' 작업에 5SB가 없습니다.",
                "task_id": tasks[1].id,
                "scheduled_for": datetime.now(timezone.utc)
            }
        ]
        
        for notif_data in notifications_data:
            notification = Notification(**notif_data)
            session.add(notification)
        
        session.commit()
        
    print("✅ 샘플 데이터 생성 완료!")
    print(f"   - 사용자: 1명")
    print(f"   - 프로젝트: {len(projects_data)}개")
    print(f"   - 작업: {len(tasks_data)}개")
    print(f"   - 5SB: {len(briefs_data)}개")
    print(f"   - DoD: {len(dods_data)}개")
    print(f"   - 템플릿: {len(templates_data)}개")
    print(f"   - 리뷰: 1개")
    print(f"   - 알림: {len(notifications_data)}개")

if __name__ == "__main__":
    create_sample_data()
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select, func
from app.models import (
    Template, TemplateUsage, BestPractice, 
    TemplateCategory, TemplateType,
    Project, Task, Brief, DoD, TaskState
)

class TemplateService:
    def __init__(self, session: Session):
        self.session = session
    
    def create_system_templates(self):
        """시스템 기본 템플릿 생성"""
        templates_data = [
            # 웹 개발 템플릿
            {
                "name": "웹 애플리케이션 개발 5SB",
                "description": "웹 애플리케이션 개발 프로젝트용 5문장 브리프 템플릿",
                "category": TemplateCategory.WEB_DEVELOPMENT,
                "template_type": TemplateType.BRIEF,
                "content": {
                    "purpose": "사용자에게 [핵심 가치]를 제공하는 웹 애플리케이션을 개발한다.",
                    "success_criteria": "[주요 기능] 구현 완료, [성능 목표] 달성, 사용자 만족도 [목표 점수] 이상",
                    "constraints": "예산 [금액], 개발 기간 [기간], 기술 스택 [기술들], 팀 규모 [인원]",
                    "priority": "MVP 기능 우선 구현 후 부가 기능 순차 개발",
                    "validation": "사용자 테스트, 성능 테스트, 보안 검토, 코드 리뷰"
                }
            },
            {
                "name": "웹 애플리케이션 DoD",
                "description": "웹 애플리케이션 개발용 완료 정의 템플릿",
                "category": TemplateCategory.WEB_DEVELOPMENT,
                "template_type": TemplateType.DOD,
                "content": {
                    "deliverable_formats": "배포된 웹 애플리케이션, 소스코드, API 문서, 사용자 매뉴얼",
                    "mandatory_checks": [
                        "모든 핵심 기능 정상 동작",
                        "반응형 디자인 적용",
                        "크로스 브라우저 호환성 확인",
                        "보안 취약점 검사 통과",
                        "성능 최적화 완료"
                    ],
                    "quality_bar": "페이지 로딩 시간 3초 이내, 모바일 접근성 AA 등급",
                    "verification": "자동화 테스트 커버리지 80% 이상, 수동 테스트 완료",
                    "version_tag": "v1.0"
                }
            },
            
            # 데이터 분석 템플릿
            {
                "name": "데이터 분석 프로젝트 5SB",
                "description": "데이터 분석 및 인사이트 도출 프로젝트용 템플릿",
                "category": TemplateCategory.DATA_ANALYSIS,
                "template_type": TemplateType.BRIEF,
                "content": {
                    "purpose": "[데이터셋]을 분석하여 [비즈니스 목표]에 대한 인사이트를 도출한다.",
                    "success_criteria": "핵심 질문 [개수]개 답변, 실행 가능한 권고사항 [개수]개 제시, 신뢰도 [%] 이상",
                    "constraints": "데이터 품질 제약, 분석 기간 [기간], 사용 도구 [도구들]",
                    "priority": "핵심 KPI 분석 → 세부 패턴 분석 → 예측 모델링 순",
                    "validation": "통계적 유의성 검증, 도메인 전문가 검토, 결과 재현성 확인"
                }
            },
            
            # 연구 프로젝트 템플릿
            {
                "name": "연구 프로젝트 5SB",
                "description": "연구 및 조사 프로젝트용 템플릿",
                "category": TemplateCategory.RESEARCH,
                "template_type": TemplateType.BRIEF,
                "content": {
                    "purpose": "[연구 주제]에 대한 체계적 연구를 통해 [연구 목표]를 달성한다.",
                    "success_criteria": "연구 가설 검증 완료, 논문/보고서 작성, 연구 결과 발표",
                    "constraints": "연구 기간 [기간], 예산 [금액], 참여자 [인원], 윤리적 제약사항",
                    "priority": "문헌 조사 → 연구 설계 → 데이터 수집 → 분석 → 결과 도출",
                    "validation": "동료 검토, 통계적 검증, 결과의 일반화 가능성 평가"
                }
            },
            
            # 마케팅 캠페인 템플릿
            {
                "name": "마케팅 캠페인 5SB",
                "description": "마케팅 캠페인 기획 및 실행용 템플릿",
                "category": TemplateCategory.MARKETING,
                "template_type": TemplateType.BRIEF,
                "content": {
                    "purpose": "[타겟 고객]에게 [핵심 메시지]를 전달하여 [비즈니스 목표]를 달성한다.",
                    "success_criteria": "도달률 [%], 전환율 [%], ROI [배수] 이상 달성",
                    "constraints": "마케팅 예산 [금액], 캠페인 기간 [기간], 사용 채널 제한",
                    "priority": "브랜드 인지도 → 리드 생성 → 고객 전환 순",
                    "validation": "A/B 테스트, 성과 지표 모니터링, 고객 피드백 수집"
                }
            }
        ]
        
        for template_data in templates_data:
            # 이미 존재하는지 확인
            existing = self.session.exec(
                select(Template).where(
                    Template.name == template_data["name"],
                    Template.is_system_template == True
                )
            ).first()
            
            if not existing:
                template = Template(
                    **template_data,
                    is_system_template=True,
                    tags=["system", "default", template_data["category"].value.lower()]
                )
                self.session.add(template)
        
        self.session.commit()
    
    def get_templates(
        self, 
        category: Optional[TemplateCategory] = None,
        template_type: Optional[TemplateType] = None,
        include_system: bool = True,
        include_ai: bool = True,
        limit: int = 50
    ) -> List[Template]:
        """템플릿 목록 조회"""
        query = select(Template)
        
        conditions = []
        
        if category:
            conditions.append(Template.category == category)
        
        if template_type:
            conditions.append(Template.template_type == template_type)
        
        if not include_system:
            conditions.append(Template.is_system_template == False)
        
        if not include_ai:
            conditions.append(Template.is_ai_generated == False)
        
        if conditions:
            query = query.where(*conditions)
        
        query = query.order_by(Template.usage_count.desc(), Template.created_at.desc()).limit(limit)
        
        return self.session.exec(query).all()
    
    def get_recommended_templates(
        self, 
        project_keywords: List[str],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """키워드 기반 템플릿 추천"""
        all_templates = self.session.exec(select(Template)).all()
        
        recommendations = []
        
        for template in all_templates:
            score = self._calculate_template_relevance(template, project_keywords)
            if score > 0:
                recommendations.append({
                    "template": template,
                    "relevance_score": score,
                    "match_reasons": self._get_match_reasons(template, project_keywords)
                })
        
        # 관련성 점수 순으로 정렬
        recommendations.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return recommendations[:limit]
    
    def generate_template_from_success_project(self, project_id: int) -> Optional[Dict[str, Any]]:
        """성공한 프로젝트에서 템플릿 자동 생성"""
        project = self.session.get(Project, project_id)
        if not project:
            return None
        
        # 프로젝트의 작업들 조회
        tasks = self.session.exec(
            select(Task).where(Task.project_id == project_id)
        ).all()
        
        # 완료된 작업이 80% 이상인 경우만 성공 프로젝트로 간주
        completed_tasks = [t for t in tasks if t.state == TaskState.DONE]
        if not tasks or len(completed_tasks) / len(tasks) < 0.8:
            return None
        
        # 프로젝트의 Brief들 수집
        briefs = []
        dods = []
        
        for task in tasks:
            if hasattr(task, 'brief') and task.brief:
                briefs.append(task.brief)
            if hasattr(task, 'dod') and task.dod:
                dods.append(task.dod)
        
        if not briefs and not dods:
            return None
        
        # Brief 템플릿 생성
        template_data = {}
        
        if briefs:
            # 공통 패턴 추출 (간단한 구현)
            common_brief = self._extract_brief_patterns(briefs)
            
            brief_template = Template(
                name=f"{project.name} 기반 5SB 템플릿",
                description=f"성공한 프로젝트 '{project.name}'에서 추출한 5SB 템플릿",
                category=self._infer_project_category(project),
                template_type=TemplateType.BRIEF,
                content=common_brief,
                is_ai_generated=True,
                source_project_id=project_id,
                success_rate=len(completed_tasks) / len(tasks),
                tags=self._extract_project_tags(project, tasks)
            )
            
            self.session.add(brief_template)
            template_data["brief_template"] = brief_template
        
        if dods:
            # DoD 패턴 추출
            common_dod = self._extract_dod_patterns(dods)
            
            dod_template = Template(
                name=f"{project.name} 기반 DoD 템플릿",
                description=f"성공한 프로젝트 '{project.name}'에서 추출한 DoD 템플릿",
                category=self._infer_project_category(project),
                template_type=TemplateType.DOD,
                content=common_dod,
                is_ai_generated=True,
                source_project_id=project_id,
                success_rate=len(completed_tasks) / len(tasks),
                tags=self._extract_project_tags(project, tasks)
            )
            
            self.session.add(dod_template)
            template_data["dod_template"] = dod_template
        
        self.session.commit()
        
        return template_data
    
    def record_template_usage(
        self,
        template_id: int,
        used_for: str,
        project_id: Optional[int] = None,
        task_id: Optional[int] = None
    ):
        """템플릿 사용 기록"""
        usage = TemplateUsage(
            template_id=template_id,
            project_id=project_id,
            task_id=task_id,
            used_for=used_for
        )
        
        self.session.add(usage)
        
        # 사용 횟수 증가
        template = self.session.get(Template, template_id)
        if template:
            template.usage_count += 1
            
        self.session.commit()
    
    def get_best_practices(
        self, 
        category: Optional[TemplateCategory] = None,
        limit: int = 20
    ) -> List[BestPractice]:
        """베스트 프랙티스 조회"""
        query = select(BestPractice)
        
        if category:
            query = query.where(BestPractice.category == category)
        
        query = query.order_by(BestPractice.confidence_score.desc()).limit(limit)
        
        return self.session.exec(query).all()
    
    def _calculate_template_relevance(self, template: Template, keywords: List[str]) -> float:
        """템플릿 관련성 점수 계산"""
        if not keywords:
            return 0.0
        
        score = 0.0
        
        # 이름에서 키워드 매칭
        template_name = template.name.lower()
        for keyword in keywords:
            if keyword.lower() in template_name:
                score += 3.0
        
        # 설명에서 키워드 매칭
        if template.description:
            template_desc = template.description.lower()
            for keyword in keywords:
                if keyword.lower() in template_desc:
                    score += 2.0
        
        # 태그에서 키워드 매칭
        for tag in template.tags:
            for keyword in keywords:
                if keyword.lower() in tag.lower():
                    score += 1.5
        
        # 카테고리 매칭
        category_name = template.category.value.lower().replace('_', ' ')
        for keyword in keywords:
            if keyword.lower() in category_name:
                score += 1.0
        
        # 사용 횟수 보너스 (인기도)
        popularity_bonus = min(template.usage_count * 0.1, 2.0)
        score += popularity_bonus
        
        # 성공률 보너스
        if template.success_rate:
            success_bonus = template.success_rate * 2.0
            score += success_bonus
        
        return round(score, 2)
    
    def _get_match_reasons(self, template: Template, keywords: List[str]) -> List[str]:
        """매칭 이유 설명"""
        reasons = []
        
        for keyword in keywords:
            if keyword.lower() in template.name.lower():
                reasons.append(f"템플릿명에 '{keyword}' 포함")
            elif template.description and keyword.lower() in template.description.lower():
                reasons.append(f"설명에 '{keyword}' 포함")
        
        if template.usage_count > 5:
            reasons.append(f"{template.usage_count}회 사용된 인기 템플릿")
        
        if template.success_rate and template.success_rate > 0.8:
            reasons.append(f"성공률 {template.success_rate*100:.0f}%의 검증된 템플릿")
        
        return reasons
    
    def _extract_brief_patterns(self, briefs: List[Brief]) -> Dict[str, str]:
        """Brief들에서 공통 패턴 추출"""
        if not briefs:
            return {}
        
        # 간단한 구현: 가장 길고 구체적인 내용을 선택
        best_brief = max(briefs, key=lambda b: len(b.purpose) + len(b.success_criteria))
        
        return {
            "purpose": best_brief.purpose,
            "success_criteria": best_brief.success_criteria,
            "constraints": best_brief.constraints,
            "priority": best_brief.priority,
            "validation": best_brief.validation
        }
    
    def _extract_dod_patterns(self, dods: List[DoD]) -> Dict[str, Any]:
        """DoD들에서 공통 패턴 추출"""
        if not dods:
            return {}
        
        # 가장 포괄적인 DoD 선택
        best_dod = max(dods, key=lambda d: len(d.mandatory_checks) if d.mandatory_checks else 0)
        
        return {
            "deliverable_formats": best_dod.deliverable_formats,
            "mandatory_checks": best_dod.mandatory_checks if best_dod.mandatory_checks else [],
            "quality_bar": best_dod.quality_bar,
            "verification": best_dod.verification,
            "version_tag": "v1.0"
        }
    
    def _infer_project_category(self, project: Project) -> TemplateCategory:
        """프로젝트명/설명으로 카테고리 추론"""
        text = (project.name + " " + (project.description or "")).lower()
        
        category_keywords = {
            TemplateCategory.WEB_DEVELOPMENT: ["웹", "web", "website", "frontend", "backend"],
            TemplateCategory.MOBILE_APP: ["모바일", "앱", "mobile", "app", "ios", "android"],
            TemplateCategory.DATA_ANALYSIS: ["데이터", "분석", "data", "analysis", "analytics"],
            TemplateCategory.RESEARCH: ["연구", "조사", "research", "study", "survey"],
            TemplateCategory.MARKETING: ["마케팅", "광고", "marketing", "campaign", "promotion"],
            TemplateCategory.DESIGN: ["디자인", "design", "ui", "ux", "graphic"],
            TemplateCategory.INFRASTRUCTURE: ["인프라", "infrastructure", "server", "cloud"],
            TemplateCategory.AUTOMATION: ["자동화", "automation", "script", "bot"]
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in text for keyword in keywords):
                return category
        
        return TemplateCategory.GENERAL
    
    def _extract_project_tags(self, project: Project, tasks: List[Task]) -> List[str]:
        """프로젝트에서 태그 추출"""
        tags = []
        
        # 프로젝트명에서 키워드 추출
        project_words = project.name.lower().split()
        tags.extend([word for word in project_words if len(word) >= 3])
        
        # 작업 개수 기반 태그
        if len(tasks) > 10:
            tags.append("large-project")
        elif len(tasks) > 5:
            tags.append("medium-project")
        else:
            tags.append("small-project")
        
        # 성공 기반 태그
        completed = len([t for t in tasks if t.state == TaskState.DONE])
        if completed / len(tasks) > 0.9:
            tags.append("high-success")
        elif completed / len(tasks) > 0.7:
            tags.append("medium-success")
        
        return list(set(tags))  # 중복 제거
    
    def get_template_stats(self) -> Dict[str, Any]:
        """템플릿 통계"""
        total_templates = self.session.exec(select(func.count(Template.id))).first() or 0
        system_templates = self.session.exec(
            select(func.count(Template.id)).where(Template.is_system_template == True)
        ).first() or 0
        ai_templates = self.session.exec(
            select(func.count(Template.id)).where(Template.is_ai_generated == True)
        ).first() or 0
        
        # 카테고리별 분포
        category_stats = {}
        for category in TemplateCategory:
            count = self.session.exec(
                select(func.count(Template.id)).where(Template.category == category)
            ).first() or 0
            category_stats[category.value] = count
        
        return {
            "total_templates": total_templates,
            "system_templates": system_templates,
            "ai_generated_templates": ai_templates,
            "user_templates": total_templates - system_templates - ai_templates,
            "category_distribution": category_stats,
            "most_used_templates": self._get_most_used_templates(5)
        }
    
    def _get_most_used_templates(self, limit: int) -> List[Dict[str, Any]]:
        """가장 많이 사용된 템플릿들"""
        templates = self.session.exec(
            select(Template).where(Template.usage_count > 0)
            .order_by(Template.usage_count.desc()).limit(limit)
        ).all()
        
        return [
            {
                "id": t.id,
                "name": t.name,
                "category": t.category.value,
                "usage_count": t.usage_count,
                "success_rate": t.success_rate
            }
            for t in templates
        ]
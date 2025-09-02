from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlmodel import Session, select, or_, and_, func
from app.models import Project, Task, Brief, DoD, DecisionLog, Review
import re

class SearchService:
    def __init__(self, session: Session):
        self.session = session
    
    def unified_search(
        self, 
        query: str, 
        content_types: Optional[List[str]] = None,
        limit: int = 50
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        통합 검색: 모든 콘텐츠 타입에서 검색
        
        Args:
            query: 검색어
            content_types: 검색할 콘텐츠 타입 리스트 ['projects', 'tasks', 'briefs', 'dod', 'decisions', 'reviews']
            limit: 결과 제한 수
        """
        if not query or len(query.strip()) < 2:
            return {"results": {}}
        
        query = query.strip().lower()
        
        # 기본적으로 모든 타입 검색
        if not content_types:
            content_types = ['projects', 'tasks', 'briefs', 'dod', 'decisions', 'reviews']
        
        results = {}
        
        # 프로젝트 검색
        if 'projects' in content_types:
            results['projects'] = self._search_projects(query, limit)
        
        # 작업 검색
        if 'tasks' in content_types:
            results['tasks'] = self._search_tasks(query, limit)
        
        # 5SB 검색
        if 'briefs' in content_types:
            results['briefs'] = self._search_briefs(query, limit)
        
        # DoD 검색
        if 'dod' in content_types:
            results['dod'] = self._search_dod(query, limit)
        
        # 의사결정 검색
        if 'decisions' in content_types:
            results['decisions'] = self._search_decisions(query, limit)
        
        # 리뷰 검색
        if 'reviews' in content_types:
            results['reviews'] = self._search_reviews(query, limit)
        
        return {"results": results, "query": query, "total_results": sum(len(v) for v in results.values())}
    
    def _search_projects(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """프로젝트 검색"""
        projects = self.session.exec(
            select(Project).where(
                or_(
                    func.lower(Project.name).contains(query),
                    func.lower(Project.description).contains(query)
                )
            ).limit(limit)
        ).all()
        
        return [
            {
                "id": p.id,
                "type": "project",
                "title": p.name,
                "content": p.description or "",
                "created_at": p.created_at.isoformat(),
                "relevance_score": self._calculate_text_relevance(query, [p.name, p.description or ""])
            }
            for p in projects
        ]
    
    def _search_tasks(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """작업 검색"""
        tasks = self.session.exec(
            select(Task).where(
                func.lower(Task.title).contains(query)
            ).limit(limit)
        ).all()
        
        return [
            {
                "id": t.id,
                "type": "task",
                "title": t.title,
                "content": f"우선순위: P{t.priority}, 상태: {t.state.value}",
                "project_id": t.project_id,
                "created_at": t.created_at.isoformat(),
                "relevance_score": self._calculate_text_relevance(query, [t.title])
            }
            for t in tasks
        ]
    
    def _search_briefs(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """5SB 검색"""
        briefs = self.session.exec(
            select(Brief).where(
                or_(
                    func.lower(Brief.purpose).contains(query),
                    func.lower(Brief.success_criteria).contains(query),
                    func.lower(Brief.constraints).contains(query),
                    func.lower(Brief.priority).contains(query),
                    func.lower(Brief.validation).contains(query)
                )
            ).limit(limit)
        ).all()
        
        return [
            {
                "id": b.id,
                "type": "brief",
                "title": f"5SB - Task #{b.task_id}",
                "content": f"목적: {b.purpose[:100]}...",
                "task_id": b.task_id,
                "created_at": b.created_at.isoformat(),
                "relevance_score": self._calculate_text_relevance(
                    query, [b.purpose, b.success_criteria, b.constraints, b.priority, b.validation]
                )
            }
            for b in briefs
        ]
    
    def _search_dod(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """DoD 검색"""
        dods = self.session.exec(
            select(DoD).where(
                or_(
                    func.lower(DoD.deliverable_formats).contains(query),
                    func.lower(DoD.quality_bar).contains(query),
                    func.lower(DoD.verification).contains(query)
                )
            ).limit(limit)
        ).all()
        
        return [
            {
                "id": d.id,
                "type": "dod",
                "title": f"DoD - Task #{d.task_id}",
                "content": f"품질 기준: {d.quality_bar[:100]}...",
                "task_id": d.task_id,
                "created_at": d.created_at.isoformat(),
                "relevance_score": self._calculate_text_relevance(
                    query, [d.deliverable_formats, d.quality_bar, d.verification]
                )
            }
            for d in dods
        ]
    
    def _search_decisions(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """의사결정 검색"""
        decisions = self.session.exec(
            select(DecisionLog).where(
                or_(
                    func.lower(DecisionLog.problem).contains(query),
                    func.lower(DecisionLog.options).contains(query),
                    func.lower(DecisionLog.decision_reason).contains(query),
                    func.lower(DecisionLog.assumptions_risks).contains(query)
                )
            ).limit(limit)
        ).all()
        
        return [
            {
                "id": d.id,
                "type": "decision",
                "title": f"의사결정 - {d.problem[:50]}...",
                "content": f"결정: {d.decision_reason[:100]}...",
                "task_id": d.task_id,
                "created_at": d.created_at.isoformat(),
                "relevance_score": self._calculate_text_relevance(
                    query, [d.problem, d.options, d.decision_reason, d.assumptions_risks]
                )
            }
            for d in decisions
        ]
    
    def _search_reviews(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """리뷰 검색"""
        reviews = self.session.exec(
            select(Review).where(
                or_(
                    func.lower(Review.positives).contains(query),
                    func.lower(Review.negatives).contains(query),
                    func.lower(Review.changes_next).contains(query)
                )
            ).limit(limit)
        ).all()
        
        return [
            {
                "id": r.id,
                "type": "review",
                "title": f"{r.review_type.value} 리뷰 - Task #{r.task_id}",
                "content": f"긍정: {r.positives[:100]}...",
                "task_id": r.task_id,
                "created_at": r.created_at.isoformat(),
                "relevance_score": self._calculate_text_relevance(
                    query, [r.positives, r.negatives, r.changes_next]
                )
            }
            for r in reviews
        ]
    
    def _calculate_text_relevance(self, query: str, texts: List[str]) -> float:
        """텍스트 관련성 점수 계산 (간단한 구현)"""
        if not texts or not query:
            return 0.0
        
        query_words = query.lower().split()
        total_score = 0.0
        
        for text in texts:
            if not text:
                continue
                
            text_lower = text.lower()
            score = 0.0
            
            # 완전 일치 점수
            if query in text_lower:
                score += 10.0
            
            # 단어별 일치 점수
            for word in query_words:
                if word in text_lower:
                    score += 1.0
            
            # 문자 길이 대비 점수 정규화
            if len(text_lower) > 0:
                score = score / len(text_lower) * 100
            
            total_score += score
        
        return round(total_score / len(texts), 2)
    
    def find_similar_projects(self, project_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """
        유사한 프로젝트 찾기
        현재는 간단한 키워드 기반 유사도 측정
        """
        current_project = self.session.get(Project, project_id)
        if not current_project:
            return []
        
        # 현재 프로젝트의 키워드 추출
        keywords = self._extract_keywords(
            [current_project.name, current_project.description or ""]
        )
        
        if not keywords:
            return []
        
        # 다른 프로젝트들과 유사도 계산
        other_projects = self.session.exec(
            select(Project).where(Project.id != project_id)
        ).all()
        
        similar_projects = []
        
        for project in other_projects:
            project_texts = [project.name, project.description or ""]
            similarity_score = self._calculate_similarity(keywords, project_texts)
            
            if similarity_score > 0:
                similar_projects.append({
                    "id": project.id,
                    "name": project.name,
                    "description": project.description,
                    "similarity_score": similarity_score,
                    "created_at": project.created_at.isoformat()
                })
        
        # 유사도 순으로 정렬
        similar_projects.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return similar_projects[:limit]
    
    def get_decision_patterns(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        의사결정 패턴 분석
        유사한 문제에 대한 과거 의사결정들을 찾음
        """
        if not query or len(query.strip()) < 3:
            return []
        
        query = query.strip().lower()
        
        # 유사한 문제를 다룬 의사결정들 찾기
        similar_decisions = self.session.exec(
            select(DecisionLog).where(
                or_(
                    func.lower(DecisionLog.problem).contains(query),
                    func.lower(DecisionLog.options).contains(query)
                )
            ).order_by(DecisionLog.created_at.desc()).limit(limit)
        ).all()
        
        patterns = []
        
        for decision in similar_decisions:
            # 해당 의사결정의 D+7 리뷰가 있는지 확인
            has_review = decision.d_plus_7_review is not None and len(decision.d_plus_7_review.strip()) > 0
            
            patterns.append({
                "id": decision.id,
                "problem": decision.problem,
                "options": decision.options,
                "decision": decision.decision_reason,
                "risks": decision.assumptions_risks,
                "d_plus_7_review": decision.d_plus_7_review,
                "has_review": has_review,
                "task_id": decision.task_id,
                "created_at": decision.created_at.isoformat(),
                "relevance_score": self._calculate_text_relevance(
                    query, [decision.problem, decision.options]
                )
            })
        
        # 관련성 순으로 정렬
        patterns.sort(key=lambda x: x["relevance_score"], reverse=True)
        
        return patterns
    
    def _extract_keywords(self, texts: List[str]) -> List[str]:
        """텍스트에서 키워드 추출 (간단한 구현)"""
        if not texts:
            return []
        
        # 한글, 영문, 숫자만 추출하고 공백으로 분리
        all_text = " ".join(text for text in texts if text)
        
        # 간단한 키워드 추출 (3글자 이상)
        words = re.findall(r'[가-힣a-zA-Z0-9]+', all_text.lower())
        keywords = [word for word in words if len(word) >= 3]
        
        # 중복 제거하고 빈도 기준으로 상위 키워드만 반환
        unique_keywords = list(set(keywords))
        
        return unique_keywords[:10]  # 상위 10개만
    
    def _calculate_similarity(self, keywords: List[str], texts: List[str]) -> float:
        """키워드 기반 유사도 계산"""
        if not keywords or not texts:
            return 0.0
        
        all_text = " ".join(text for text in texts if text).lower()
        
        matches = 0
        for keyword in keywords:
            if keyword in all_text:
                matches += 1
        
        # 매치 비율 계산
        similarity = (matches / len(keywords)) * 100
        
        return round(similarity, 2)
    
    def get_content_summary(self) -> Dict[str, int]:
        """전체 콘텐츠 요약 통계"""
        projects_count = self.session.exec(select(func.count(Project.id))).first() or 0
        tasks_count = self.session.exec(select(func.count(Task.id))).first() or 0
        briefs_count = self.session.exec(select(func.count(Brief.id))).first() or 0
        dod_count = self.session.exec(select(func.count(DoD.id))).first() or 0
        decisions_count = self.session.exec(select(func.count(DecisionLog.id))).first() or 0
        reviews_count = self.session.exec(select(func.count(Review.id))).first() or 0
        
        return {
            "projects": projects_count,
            "tasks": tasks_count,
            "briefs": briefs_count,
            "dod": dod_count,
            "decisions": decisions_count,
            "reviews": reviews_count,
            "total": projects_count + tasks_count + briefs_count + dod_count + decisions_count + reviews_count
        }
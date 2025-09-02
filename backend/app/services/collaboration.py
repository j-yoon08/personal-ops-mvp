from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from sqlmodel import Session, select, and_, or_
from app.models import (
    User, Project, Task, ProjectMember, ProjectInvite, ApprovalWorkflow, 
    ApprovalResponse, TeamDecision, DecisionVote, DecisionComment,
    UserRole, SharePermission, InviteStatus, ApprovalStatus
)
import secrets
import uuid

class CollaborationService:
    """협업 및 공유 기능을 위한 서비스"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # 사용자 관리
    def get_or_create_user(self, username: str, email: str, full_name: Optional[str] = None) -> User:
        """사용자 조회 또는 생성"""
        # 기존 사용자 조회
        existing_user = self.db.exec(
            select(User).where(or_(User.username == username, User.email == email))
        ).first()
        
        if existing_user:
            return existing_user
        
        # 새 사용자 생성
        user = User(
            username=username,
            email=email,
            full_name=full_name or username
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def get_user_projects(self, user_id: int, include_shared: bool = True) -> List[Project]:
        """사용자의 프로젝트 목록 조회"""
        if include_shared:
            # 소유 프로젝트 + 참여 프로젝트
            owned_projects = self.db.exec(
                select(Project).where(Project.owner_id == user_id)
            ).all()
            
            # 참여 중인 프로젝트
            member_project_ids = self.db.exec(
                select(ProjectMember.project_id).where(ProjectMember.user_id == user_id)
            ).all()
            
            shared_projects = []
            if member_project_ids:
                shared_projects = self.db.exec(
                    select(Project).where(Project.id.in_(member_project_ids))
                ).all()
            
            return list(owned_projects) + list(shared_projects)
        else:
            # 소유 프로젝트만
            return list(self.db.exec(
                select(Project).where(Project.owner_id == user_id)
            ).all())
    
    # 프로젝트 공유 관리
    def share_project(
        self, 
        project_id: int, 
        owner_id: int,
        target_user_id: Optional[int] = None,
        target_email: Optional[str] = None,
        role: UserRole = UserRole.MEMBER,
        permissions: SharePermission = SharePermission.READ
    ) -> ProjectInvite:
        """프로젝트 공유 초대 생성"""
        
        # 프로젝트 소유자 확인
        project = self.db.get(Project, project_id)
        if not project or project.owner_id != owner_id:
            raise ValueError("프로젝트 소유자만 공유할 수 있습니다")
        
        # 초대 토큰 생성
        invite_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)  # 7일 후 만료
        
        invite = ProjectInvite(
            project_id=project_id,
            invited_by_id=owner_id,
            invited_user_id=target_user_id,
            invited_email=target_email,
            role=role,
            permissions=permissions,
            invite_token=invite_token,
            expires_at=expires_at
        )
        
        self.db.add(invite)
        self.db.commit()
        self.db.refresh(invite)
        return invite
    
    def accept_project_invite(self, invite_token: str, user_id: int) -> ProjectMember:
        """프로젝트 초대 수락"""
        invite = self.db.exec(
            select(ProjectInvite).where(
                and_(
                    ProjectInvite.invite_token == invite_token,
                    ProjectInvite.status == InviteStatus.PENDING,
                    ProjectInvite.expires_at > datetime.now(timezone.utc)
                )
            )
        ).first()
        
        if not invite:
            raise ValueError("유효하지 않은 초대 링크입니다")
        
        # 초대 상태 업데이트
        invite.status = InviteStatus.ACCEPTED
        invite.responded_at = datetime.now(timezone.utc)
        
        # 프로젝트 멤버 추가
        member = ProjectMember(
            project_id=invite.project_id,
            user_id=user_id,
            role=invite.role,
            permissions=invite.permissions
        )
        
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member
    
    def get_project_members(self, project_id: int) -> List[Dict]:
        """프로젝트 멤버 목록 조회"""
        # 소유자 정보
        project = self.db.get(Project, project_id)
        if not project:
            return []
        
        members = []
        
        # 프로젝트 소유자 추가
        if project.owner:
            members.append({
                "user": project.owner,
                "role": UserRole.OWNER,
                "permissions": SharePermission.ADMIN,
                "joined_at": project.created_at,
                "is_owner": True
            })
        
        # 일반 멤버들 추가
        project_members = self.db.exec(
            select(ProjectMember, User).join(User).where(ProjectMember.project_id == project_id)
        ).all()
        
        for member, user in project_members:
            members.append({
                "user": user,
                "role": member.role,
                "permissions": member.permissions,
                "joined_at": member.joined_at,
                "is_owner": False
            })
        
        return members
    
    def check_user_permission(self, user_id: int, project_id: int, required_permission: SharePermission) -> bool:
        """사용자 권한 확인"""
        # 소유자는 모든 권한 보유
        project = self.db.get(Project, project_id)
        if project and project.owner_id == user_id:
            return True
        
        # 멤버 권한 확인
        member = self.db.exec(
            select(ProjectMember).where(
                and_(
                    ProjectMember.project_id == project_id,
                    ProjectMember.user_id == user_id
                )
            )
        ).first()
        
        if not member:
            return False
        
        # 권한 레벨 확인 (ADMIN > WRITE > READ)
        permission_levels = {
            SharePermission.READ: 1,
            SharePermission.WRITE: 2,
            SharePermission.ADMIN: 3
        }
        
        user_level = permission_levels.get(member.permissions, 0)
        required_level = permission_levels.get(required_permission, 0)
        
        return user_level >= required_level
    
    # 태스크 할당 관리
    def assign_task(self, task_id: int, assignee_id: int, assigner_id: int) -> Task:
        """태스크 담당자 지정"""
        task = self.db.get(Task, task_id)
        if not task:
            raise ValueError("태스크를 찾을 수 없습니다")
        
        # 할당자 권한 확인
        if not self.check_user_permission(assigner_id, task.project_id, SharePermission.WRITE):
            raise ValueError("태스크 할당 권한이 없습니다")
        
        # 피할당자가 프로젝트 멤버인지 확인
        if not self.check_user_permission(assignee_id, task.project_id, SharePermission.READ):
            raise ValueError("프로젝트 멤버가 아닌 사용자에게는 할당할 수 없습니다")
        
        task.assignee_id = assignee_id
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def get_user_workload(self, user_id: int, project_id: Optional[int] = None) -> Dict:
        """사용자 워크로드 조회"""
        query = select(Task).where(Task.assignee_id == user_id)
        if project_id:
            query = query.where(Task.project_id == project_id)
        
        tasks = self.db.exec(query).all()
        
        from app.models import TaskState
        workload = {
            "total_tasks": len(tasks),
            "by_state": {
                "BACKLOG": 0,
                "IN_PROGRESS": 0,
                "DONE": 0,
                "PAUSED": 0,
                "CANCELED": 0
            },
            "overdue_tasks": 0,
            "high_priority_tasks": 0
        }
        
        now = datetime.now(timezone.utc).date()
        
        for task in tasks:
            workload["by_state"][task.state] += 1
            
            if task.due_date and task.due_date < now and task.state not in [TaskState.DONE, TaskState.CANCELED]:
                workload["overdue_tasks"] += 1
            
            if task.priority <= 2:  # 높은 우선순위
                workload["high_priority_tasks"] += 1
        
        return workload
    
    # 승인 워크플로우
    def create_approval_workflow(
        self, 
        project_id: int,
        title: str,
        description: str,
        requested_by_id: int,
        approver_user_ids: List[int],
        required_approvers: int = 1,
        task_id: Optional[int] = None,
        decision_id: Optional[int] = None
    ) -> ApprovalWorkflow:
        """승인 워크플로우 생성"""
        
        # 요청자 권한 확인
        if not self.check_user_permission(requested_by_id, project_id, SharePermission.WRITE):
            raise ValueError("승인 요청 권한이 없습니다")
        
        workflow = ApprovalWorkflow(
            project_id=project_id,
            task_id=task_id,
            decision_id=decision_id,
            title=title,
            description=description,
            requested_by_id=requested_by_id,
            required_approvers=min(required_approvers, len(approver_user_ids)),
            approver_user_ids=approver_user_ids
        )
        
        self.db.add(workflow)
        self.db.commit()
        self.db.refresh(workflow)
        return workflow
    
    def respond_to_approval(
        self, 
        workflow_id: int, 
        approver_id: int, 
        is_approved: bool,
        comment: Optional[str] = None
    ) -> ApprovalResponse:
        """승인 응답"""
        
        workflow = self.db.get(ApprovalWorkflow, workflow_id)
        if not workflow or workflow.status != ApprovalStatus.PENDING:
            raise ValueError("유효하지 않은 승인 요청입니다")
        
        if approver_id not in workflow.approver_user_ids:
            raise ValueError("승인 권한이 없습니다")
        
        # 이미 응답했는지 확인
        existing_response = self.db.exec(
            select(ApprovalResponse).where(
                and_(
                    ApprovalResponse.workflow_id == workflow_id,
                    ApprovalResponse.approver_id == approver_id
                )
            )
        ).first()
        
        if existing_response:
            raise ValueError("이미 승인 응답을 했습니다")
        
        # 승인 응답 생성
        response = ApprovalResponse(
            workflow_id=workflow_id,
            approver_id=approver_id,
            is_approved=is_approved,
            comment=comment
        )
        
        self.db.add(response)
        
        # 워크플로우 상태 업데이트 확인
        approvals = self.db.exec(
            select(ApprovalResponse).where(ApprovalResponse.workflow_id == workflow_id)
        ).all()
        
        approved_count = sum(1 for resp in approvals if resp.is_approved)
        rejected_count = sum(1 for resp in approvals if not resp.is_approved)
        
        if approved_count >= workflow.required_approvers:
            workflow.status = ApprovalStatus.APPROVED
            workflow.completed_at = datetime.now(timezone.utc)
        elif rejected_count > 0:  # 하나라도 거절되면 전체 거절
            workflow.status = ApprovalStatus.REJECTED
            workflow.completed_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(response)
        return response
    
    # 팀 의사결정
    def create_team_decision(
        self,
        project_id: int,
        title: str,
        description: str,
        options: List[str],
        created_by_id: int,
        task_id: Optional[int] = None,
        is_voting_enabled: bool = True,
        voting_deadline: Optional[datetime] = None,
        allow_multiple_votes: bool = False
    ) -> TeamDecision:
        """팀 의사결정 생성"""
        
        # 생성자 권한 확인
        if not self.check_user_permission(created_by_id, project_id, SharePermission.WRITE):
            raise ValueError("의사결정 생성 권한이 없습니다")
        
        decision = TeamDecision(
            project_id=project_id,
            task_id=task_id,
            title=title,
            description=description,
            options=options,
            created_by_id=created_by_id,
            is_voting_enabled=is_voting_enabled,
            voting_deadline=voting_deadline,
            allow_multiple_votes=allow_multiple_votes
        )
        
        self.db.add(decision)
        self.db.commit()
        self.db.refresh(decision)
        return decision
    
    def cast_vote(
        self,
        decision_id: int,
        voter_id: int,
        selected_options: List[str],
        reasoning: Optional[str] = None
    ) -> DecisionVote:
        """투표하기"""
        
        decision = self.db.get(TeamDecision, decision_id)
        if not decision:
            raise ValueError("의사결정을 찾을 수 없습니다")
        
        if decision.is_concluded:
            raise ValueError("이미 결론이 난 의사결정입니다")
        
        if not decision.is_voting_enabled:
            raise ValueError("투표가 활성화되지 않은 의사결정입니다")
        
        if decision.voting_deadline and datetime.now(timezone.utc) > decision.voting_deadline:
            raise ValueError("투표 마감 시간이 지났습니다")
        
        # 투표자 권한 확인
        if not self.check_user_permission(voter_id, decision.project_id, SharePermission.READ):
            raise ValueError("투표 권한이 없습니다")
        
        # 기존 투표 확인
        existing_vote = self.db.exec(
            select(DecisionVote).where(
                and_(
                    DecisionVote.decision_id == decision_id,
                    DecisionVote.voter_id == voter_id
                )
            )
        ).first()
        
        if existing_vote and not decision.allow_multiple_votes:
            # 기존 투표 업데이트
            existing_vote.selected_options = selected_options
            existing_vote.reasoning = reasoning
            existing_vote.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(existing_vote)
            return existing_vote
        
        # 새 투표 생성
        vote = DecisionVote(
            decision_id=decision_id,
            voter_id=voter_id,
            selected_options=selected_options,
            reasoning=reasoning
        )
        
        self.db.add(vote)
        self.db.commit()
        self.db.refresh(vote)
        return vote
    
    def conclude_decision(
        self,
        decision_id: int,
        concluder_id: int,
        final_decision: str,
        decision_rationale: Optional[str] = None
    ) -> TeamDecision:
        """의사결정 결론 내리기"""
        
        decision = self.db.get(TeamDecision, decision_id)
        if not decision:
            raise ValueError("의사결정을 찾을 수 없습니다")
        
        # 결론자 권한 확인 (프로젝트 소유자 또는 관리자)
        if not (decision.created_by_id == concluder_id or 
                self.check_user_permission(concluder_id, decision.project_id, SharePermission.ADMIN)):
            raise ValueError("의사결정 결론 권한이 없습니다")
        
        decision.is_concluded = True
        decision.final_decision = final_decision
        decision.decision_rationale = decision_rationale
        decision.concluded_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(decision)
        return decision
    
    def add_decision_comment(
        self,
        decision_id: int,
        author_id: int,
        content: str,
        parent_comment_id: Optional[int] = None
    ) -> DecisionComment:
        """의사결정에 댓글 추가"""
        
        decision = self.db.get(TeamDecision, decision_id)
        if not decision:
            raise ValueError("의사결정을 찾을 수 없습니다")
        
        # 댓글 작성자 권한 확인
        if not self.check_user_permission(author_id, decision.project_id, SharePermission.READ):
            raise ValueError("댓글 작성 권한이 없습니다")
        
        comment = DecisionComment(
            decision_id=decision_id,
            author_id=author_id,
            content=content,
            parent_comment_id=parent_comment_id
        )
        
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment
    
    def get_decision_stats(self, decision_id: int) -> Dict:
        """의사결정 통계"""
        votes = self.db.exec(
            select(DecisionVote).where(DecisionVote.decision_id == decision_id)
        ).all()
        
        if not votes:
            return {"total_votes": 0, "option_counts": {}, "participation_rate": 0}
        
        option_counts = {}
        for vote in votes:
            for option in vote.selected_options:
                option_counts[option] = option_counts.get(option, 0) + 1
        
        # 참여율 계산 (프로젝트 멤버 대비)
        decision = self.db.get(TeamDecision, decision_id)
        if decision:
            project_members = self.get_project_members(decision.project_id)
            total_members = len(project_members)
            participation_rate = len(votes) / total_members if total_members > 0 else 0
        else:
            participation_rate = 0
        
        return {
            "total_votes": len(votes),
            "option_counts": option_counts,
            "participation_rate": participation_rate
        }
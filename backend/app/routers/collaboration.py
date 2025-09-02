from datetime import datetime, timezone
from typing import Optional, List, Dict
from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session
from pydantic import BaseModel, EmailStr

from app.db.session import get_session
from app.services.collaboration import CollaborationService
from app.models import (
    User, Project, Task, ProjectMember, ProjectInvite, ApprovalWorkflow,
    TeamDecision, DecisionVote, DecisionComment,
    UserRole, SharePermission, InviteStatus, ApprovalStatus
)

router = APIRouter(prefix="/collaboration", tags=["collaboration"])

# Request/Response 모델들
class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class ShareProjectRequest(BaseModel):
    target_user_id: Optional[int] = None
    target_email: Optional[EmailStr] = None
    role: UserRole = UserRole.MEMBER
    permissions: SharePermission = SharePermission.READ

class AssignTaskRequest(BaseModel):
    assignee_id: int

class CreateApprovalRequest(BaseModel):
    title: str
    description: str
    approver_user_ids: List[int]
    required_approvers: int = 1
    task_id: Optional[int] = None
    decision_id: Optional[int] = None

class ApprovalResponseRequest(BaseModel):
    is_approved: bool
    comment: Optional[str] = None

class CreateTeamDecisionRequest(BaseModel):
    title: str
    description: str
    options: List[str]
    task_id: Optional[int] = None
    is_voting_enabled: bool = True
    voting_deadline: Optional[datetime] = None
    allow_multiple_votes: bool = False

class CastVoteRequest(BaseModel):
    selected_options: List[str]
    reasoning: Optional[str] = None

class ConcludeDecisionRequest(BaseModel):
    final_decision: str
    decision_rationale: Optional[str] = None

class AddCommentRequest(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None

# 사용자 관리 엔드포인트
@router.post("/users", response_model=dict)
def create_user(request: CreateUserRequest, db: Session = Depends(get_session)):
    """사용자 생성 또는 조회"""
    service = CollaborationService(db)
    user = service.get_or_create_user(
        username=request.username,
        email=request.email,
        full_name=request.full_name
    )
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "created_at": user.created_at
        }
    }

@router.get("/users/{user_id}/projects")
def get_user_projects(
    user_id: int, 
    include_shared: bool = True, 
    db: Session = Depends(get_session)
):
    """사용자 프로젝트 목록 조회"""
    service = CollaborationService(db)
    projects = service.get_user_projects(user_id, include_shared)
    
    return {
        "user_id": user_id,
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "owner_id": p.owner_id,
                "is_private": p.is_private,
                "created_at": p.created_at,
                "is_owner": p.owner_id == user_id
            }
            for p in projects
        ],
        "total": len(projects)
    }

@router.get("/users/{user_id}/workload")
def get_user_workload(
    user_id: int,
    project_id: Optional[int] = None,
    db: Session = Depends(get_session)
):
    """사용자 워크로드 조회"""
    service = CollaborationService(db)
    workload = service.get_user_workload(user_id, project_id)
    return {
        "user_id": user_id,
        "project_id": project_id,
        "workload": workload
    }

# 프로젝트 공유 엔드포인트
@router.post("/projects/{project_id}/share")
def share_project(
    project_id: int,
    request: ShareProjectRequest,
    owner_id: int,  # 실제로는 인증에서 가져와야 함
    db: Session = Depends(get_session)
):
    """프로젝트 공유"""
    if not request.target_user_id and not request.target_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_user_id 또는 target_email 중 하나는 필수입니다"
        )
    
    service = CollaborationService(db)
    try:
        invite = service.share_project(
            project_id=project_id,
            owner_id=owner_id,
            target_user_id=request.target_user_id,
            target_email=request.target_email,
            role=request.role,
            permissions=request.permissions
        )
        return {
            "message": "프로젝트 공유 초대를 보냈습니다",
            "invite": {
                "id": invite.id,
                "invite_token": invite.invite_token,
                "expires_at": invite.expires_at,
                "role": invite.role,
                "permissions": invite.permissions
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/invites/{invite_token}/accept")
def accept_invite(invite_token: str, user_id: int, db: Session = Depends(get_session)):
    """초대 수락"""
    service = CollaborationService(db)
    try:
        member = service.accept_project_invite(invite_token, user_id)
        return {
            "message": "프로젝트 초대를 수락했습니다",
            "membership": {
                "project_id": member.project_id,
                "role": member.role,
                "permissions": member.permissions,
                "joined_at": member.joined_at
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/projects/{project_id}/members")
def get_project_members(project_id: int, db: Session = Depends(get_session)):
    """프로젝트 멤버 목록"""
    service = CollaborationService(db)
    members = service.get_project_members(project_id)
    
    return {
        "project_id": project_id,
        "members": [
            {
                "user": {
                    "id": m["user"].id,
                    "username": m["user"].username,
                    "email": m["user"].email,
                    "full_name": m["user"].full_name
                },
                "role": m["role"],
                "permissions": m["permissions"],
                "joined_at": m["joined_at"],
                "is_owner": m["is_owner"]
            }
            for m in members
        ],
        "total": len(members)
    }

# 태스크 할당 엔드포인트
@router.patch("/tasks/{task_id}/assign")
def assign_task(
    task_id: int,
    request: AssignTaskRequest,
    assigner_id: int,  # 실제로는 인증에서 가져와야 함
    db: Session = Depends(get_session)
):
    """태스크 할당"""
    service = CollaborationService(db)
    try:
        task = service.assign_task(task_id, request.assignee_id, assigner_id)
        return {
            "message": "태스크를 할당했습니다",
            "task": {
                "id": task.id,
                "title": task.title,
                "assignee_id": task.assignee_id,
                "project_id": task.project_id
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# 승인 워크플로우 엔드포인트
@router.post("/projects/{project_id}/approvals")
def create_approval_workflow(
    project_id: int,
    request: CreateApprovalRequest,
    requested_by_id: int,  # 실제로는 인증에서 가져와야 함
    db: Session = Depends(get_session)
):
    """승인 워크플로우 생성"""
    service = CollaborationService(db)
    try:
        workflow = service.create_approval_workflow(
            project_id=project_id,
            title=request.title,
            description=request.description,
            requested_by_id=requested_by_id,
            approver_user_ids=request.approver_user_ids,
            required_approvers=request.required_approvers,
            task_id=request.task_id,
            decision_id=request.decision_id
        )
        return {
            "message": "승인 워크플로우를 생성했습니다",
            "workflow": {
                "id": workflow.id,
                "title": workflow.title,
                "status": workflow.status,
                "required_approvers": workflow.required_approvers,
                "created_at": workflow.created_at
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/approvals/{workflow_id}/respond")
def respond_to_approval(
    workflow_id: int,
    request: ApprovalResponseRequest,
    approver_id: int,  # 실제로는 인증에서 가져와야 함
    db: Session = Depends(get_session)
):
    """승인 응답"""
    service = CollaborationService(db)
    try:
        response = service.respond_to_approval(
            workflow_id=workflow_id,
            approver_id=approver_id,
            is_approved=request.is_approved,
            comment=request.comment
        )
        return {
            "message": "승인 응답을 등록했습니다",
            "response": {
                "id": response.id,
                "is_approved": response.is_approved,
                "comment": response.comment,
                "created_at": response.created_at
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/approvals/{workflow_id}")
def get_approval_workflow(workflow_id: int, db: Session = Depends(get_session)):
    """승인 워크플로우 상세 조회"""
    workflow = db.get(ApprovalWorkflow, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="승인 워크플로우를 찾을 수 없습니다")
    
    # 승인 응답들 조회
    from sqlmodel import select
    responses = db.exec(
        select(ApprovalResponse, User)
        .join(User, ApprovalResponse.approver_id == User.id)
        .where(ApprovalResponse.workflow_id == workflow_id)
    ).all()
    
    return {
        "workflow": {
            "id": workflow.id,
            "project_id": workflow.project_id,
            "task_id": workflow.task_id,
            "decision_id": workflow.decision_id,
            "title": workflow.title,
            "description": workflow.description,
            "required_approvers": workflow.required_approvers,
            "approver_user_ids": workflow.approver_user_ids,
            "status": workflow.status,
            "created_at": workflow.created_at,
            "completed_at": workflow.completed_at
        },
        "responses": [
            {
                "id": resp.id,
                "approver": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name
                },
                "is_approved": resp.is_approved,
                "comment": resp.comment,
                "created_at": resp.created_at
            }
            for resp, user in responses
        ]
    }

# 팀 의사결정 엔드포인트
@router.post("/projects/{project_id}/decisions")
def create_team_decision(
    project_id: int,
    request: CreateTeamDecisionRequest,
    created_by_id: int,  # 실제로는 인증에서 가져와야 함
    db: Session = Depends(get_session)
):
    """팀 의사결정 생성"""
    service = CollaborationService(db)
    try:
        decision = service.create_team_decision(
            project_id=project_id,
            title=request.title,
            description=request.description,
            options=request.options,
            created_by_id=created_by_id,
            task_id=request.task_id,
            is_voting_enabled=request.is_voting_enabled,
            voting_deadline=request.voting_deadline,
            allow_multiple_votes=request.allow_multiple_votes
        )
        return {
            "message": "팀 의사결정을 생성했습니다",
            "decision": {
                "id": decision.id,
                "title": decision.title,
                "options": decision.options,
                "is_voting_enabled": decision.is_voting_enabled,
                "voting_deadline": decision.voting_deadline,
                "created_at": decision.created_at
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/decisions/{decision_id}/vote")
def cast_vote(
    decision_id: int,
    request: CastVoteRequest,
    voter_id: int,  # 실제로는 인증에서 가져와야 함
    db: Session = Depends(get_session)
):
    """투표하기"""
    service = CollaborationService(db)
    try:
        vote = service.cast_vote(
            decision_id=decision_id,
            voter_id=voter_id,
            selected_options=request.selected_options,
            reasoning=request.reasoning
        )
        return {
            "message": "투표를 완료했습니다",
            "vote": {
                "id": vote.id,
                "selected_options": vote.selected_options,
                "reasoning": vote.reasoning,
                "created_at": vote.created_at
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/decisions/{decision_id}/conclude")
def conclude_decision(
    decision_id: int,
    request: ConcludeDecisionRequest,
    concluder_id: int,  # 실제로는 인증에서 가져와야 함
    db: Session = Depends(get_session)
):
    """의사결정 결론"""
    service = CollaborationService(db)
    try:
        decision = service.conclude_decision(
            decision_id=decision_id,
            concluder_id=concluder_id,
            final_decision=request.final_decision,
            decision_rationale=request.decision_rationale
        )
        return {
            "message": "의사결정을 결론지었습니다",
            "decision": {
                "id": decision.id,
                "final_decision": decision.final_decision,
                "decision_rationale": decision.decision_rationale,
                "concluded_at": decision.concluded_at
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/decisions/{decision_id}/comments")
def add_decision_comment(
    decision_id: int,
    request: AddCommentRequest,
    author_id: int,  # 실제로는 인증에서 가져와야 함
    db: Session = Depends(get_session)
):
    """의사결정에 댓글 추가"""
    service = CollaborationService(db)
    try:
        comment = service.add_decision_comment(
            decision_id=decision_id,
            author_id=author_id,
            content=request.content,
            parent_comment_id=request.parent_comment_id
        )
        return {
            "message": "댓글을 추가했습니다",
            "comment": {
                "id": comment.id,
                "content": comment.content,
                "parent_comment_id": comment.parent_comment_id,
                "created_at": comment.created_at
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/decisions/{decision_id}")
def get_team_decision(decision_id: int, db: Session = Depends(get_session)):
    """팀 의사결정 상세 조회"""
    decision = db.get(TeamDecision, decision_id)
    if not decision:
        raise HTTPException(status_code=404, detail="의사결정을 찾을 수 없습니다")
    
    # 투표 및 댓글 조회
    from sqlmodel import select
    votes = db.exec(
        select(DecisionVote, User)
        .join(User, DecisionVote.voter_id == User.id)
        .where(DecisionVote.decision_id == decision_id)
    ).all()
    
    comments = db.exec(
        select(DecisionComment, User)
        .join(User, DecisionComment.author_id == User.id)
        .where(DecisionComment.decision_id == decision_id)
    ).all()
    
    # 통계
    service = CollaborationService(db)
    stats = service.get_decision_stats(decision_id)
    
    return {
        "decision": {
            "id": decision.id,
            "project_id": decision.project_id,
            "task_id": decision.task_id,
            "title": decision.title,
            "description": decision.description,
            "options": decision.options,
            "is_voting_enabled": decision.is_voting_enabled,
            "voting_deadline": decision.voting_deadline,
            "allow_multiple_votes": decision.allow_multiple_votes,
            "is_concluded": decision.is_concluded,
            "final_decision": decision.final_decision,
            "decision_rationale": decision.decision_rationale,
            "created_at": decision.created_at,
            "concluded_at": decision.concluded_at
        },
        "votes": [
            {
                "id": vote.id,
                "voter": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name
                },
                "selected_options": vote.selected_options,
                "reasoning": vote.reasoning,
                "created_at": vote.created_at
            }
            for vote, user in votes
        ],
        "comments": [
            {
                "id": comment.id,
                "author": {
                    "id": user.id,
                    "username": user.username,
                    "full_name": user.full_name
                },
                "content": comment.content,
                "parent_comment_id": comment.parent_comment_id,
                "created_at": comment.created_at
            }
            for comment, user in comments
        ],
        "stats": stats
    }

@router.get("/decisions/{decision_id}/stats")
def get_decision_stats(decision_id: int, db: Session = Depends(get_session)):
    """의사결정 통계"""
    service = CollaborationService(db)
    stats = service.get_decision_stats(decision_id)
    return {
        "decision_id": decision_id,
        "stats": stats
    }
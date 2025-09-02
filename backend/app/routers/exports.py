
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session
from datetime import datetime

from app.db.session import get_session
from app.models import Project, Task, Brief, DoD, DecisionLog, Review, ReviewType

router = APIRouter(prefix="/exports", tags=["exports"])


def _fmt_date(dt) -> str:
    if not dt:
        return "—"
    # dt is expected to be timezone-aware; fall back to ISO if not
    try:
        return dt.date().isoformat()
    except Exception:
        return str(dt)


def export_project_markdown(session: Session, project_id: int) -> str:
    project = session.get(Project, project_id)
    if not project:
        raise ValueError("Project not found")

    lines: List[str] = []
    lines.append(f"# {project.name}\n\n")
    if getattr(project, "description", None):
        lines.append(f"{project.description}\n\n")

    # Overview
    tasks = getattr(project, "tasks", [])
    done = sum(1 for t in tasks if t.state.name == "DONE") if tasks else 0
    total = len(tasks)
    completion = f"{(done/total*100):.1f}%" if total else "0%"

    lines.append("## Overview\n")
    lines.append(f"- Created: {_fmt_date(getattr(project, 'created_at', None))}\n")
    lines.append(f"- Tasks: {total}\n")
    lines.append(f"- Completion: {completion}\n\n")

    # Tasks section
    lines.append("## Tasks\n")
    if not tasks:
        lines.append("(no tasks)\n\n")
    else:
        for t in tasks:
            state_label = t.state.name if hasattr(t.state, 'name') else str(t.state)
            lines.append(f"### [{state_label}] {t.title}\n")
            lines.append(f"- Priority: P{getattr(t, 'priority', '—')}\n")
            lines.append(f"- Due: {_fmt_date(getattr(t, 'due_date', None))}\n")
            lines.append(f"- DoD: {'✓' if getattr(t, 'dod_checked', False) else '✗'}\n")

            # 5SB (Brief)
            brief: Brief | None = getattr(t, 'brief', None)
            if brief:
                lines.append("- 5SB:\n")
                lines.append(f"  - Purpose: {brief.purpose}\n")
                lines.append(f"  - Success: {brief.success_criteria}\n")
                lines.append(f"  - Constraints: {brief.constraints}\n")
                lines.append(f"  - Priority: {brief.priority}\n")
                lines.append(f"  - Validation: {brief.validation}\n")

            # DoD details
            dod: DoD | None = getattr(t, 'dod', None)
            if dod:
                lines.append("- DoD Details:\n")
                lines.append(f"  - Deliverable Formats: {dod.deliverable_formats}\n")
                checks = ", ".join(dod.mandatory_checks) if isinstance(dod.mandatory_checks, list) else str(dod.mandatory_checks)
                lines.append(f"  - Mandatory: {checks}\n")
                lines.append(f"  - Quality Bar: {dod.quality_bar}\n")
                lines.append(f"  - Verification: {dod.verification}\n")
                lines.append(f"  - Deadline: {_fmt_date(getattr(dod, 'deadline', None))}\n")
                lines.append(f"  - Version: {dod.version_tag}\n")

            # Decision Logs
            decision_logs: List[DecisionLog] = getattr(t, 'decision_logs', [])
            if decision_logs:
                lines.append("- Decision Logs:\n")
                for dl in decision_logs:
                    lines.append(f"  - Date: {_fmt_date(dl.date)}\n")
                    lines.append(f"    - Problem: {dl.problem}\n")
                    lines.append(f"    - Options: {dl.options}\n")
                    lines.append(f"    - Decision: {dl.decision_reason}\n")
                    lines.append(f"    - Risks: {dl.assumptions_risks}\n")
                    if dl.d_plus_7_review:
                        lines.append(f"    - D+7 Review: {dl.d_plus_7_review}\n")

            # Reviews
            reviews: List[Review] = getattr(t, 'reviews', [])
            if reviews:
                lines.append("- Reviews:\n")
                for review in reviews:
                    review_type_label = review.review_type.value.replace('_', ' ').title()
                    lines.append(f"  - {review_type_label} ({_fmt_date(review.created_at)}):\n")
                    lines.append(f"    - Positives: {review.positives}\n")
                    lines.append(f"    - Negatives: {review.negatives}\n")
                    lines.append(f"    - Changes for Next: {review.changes_next}\n")

            lines.append("\n")

    return "".join(lines)


@router.get("/project/{project_id}/md")
def export_project_md(project_id: int, session: Session = Depends(get_session)):
    """프로젝트를 Markdown으로 내보냅니다."""
    try:
        content = export_project_markdown(session, project_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Project not found")

    return Response(
        content,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'inline; filename="project_{project_id}.md"'}
    )

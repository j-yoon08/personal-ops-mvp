from sqlmodel import Session, select
from app.models import Project, Task, Brief, DoD, Review, DecisionLog, Sample

def export_project_markdown(session: Session, project_id: int) -> str:
    project = session.get(Project, project_id)
    if not project:
        raise ValueError("Project not found")

    tasks = project.tasks
    lines = []
    lines.append(f"# Project: {project.name}\n")
    if project.description:
        lines.append(project.description + "\n")
    lines.append("## Tasks\n")

    for t in tasks:
        lines.append(f"### [{t.id}] {t.title} ({t.state})\n")
        lines.append(f"- Priority: {t.priority}, Due: {t.due_date}\n")
        lines.append(f"- DoD Checked: {t.dod_checked}\n")

        if t.brief:
            b = t.brief
            lines.append("#### 5SB\n")
            lines.append(f"- Purpose: {b.purpose}\n")
            lines.append(f"- Success: {b.success_criteria}\n")
            lines.append(f"- Constraints: {b.constraints}\n")
            lines.append(f"- Priorities: {b.priorities}\n")
            lines.append(f"- Validation: {b.validation_method}\n")

        if t.dod:
            d = t.dod
            lines.append("#### DoD\n")
            lines.append(f"- Formats: {d.deliverable_formats}\n")
            lines.append(f"- Mandatory: {d.mandatory_checks}\n")
            lines.append(f"- Quality: {d.quality_bar}\n")
            lines.append(f"- Verification: {d.verification}\n")
            lines.append(f"- Deadline: {d.deadline}, Version: {d.version_tag}\n")

        decs = t.decision_logs or []
        if decs:
            lines.append("#### Decision Logs\n")
            for dl in decs:
                lines.append(f"- {dl.date}: {dl.problem} | Reason: {dl.decision_reason} | Risks: {dl.assumptions_risks} | D+7: {dl.d_plus_7_review}\n")

        revs = t.reviews or []
        if revs:
            lines.append("#### Reviews\n")
            for rv in revs:
                lines.append(f"- {rv.review_type}: + {rv.positives} / - {rv.negatives} / → {rv.changes_next}\n")

        sams = t.samples or []
        if sams:
            lines.append("#### Samples\n")
            for s in sams:
                lines.append(f"- {int(s.proportion*100)}% | approved={s.approved} | notes={s.notes}\n")

        lines.append("\n")

    return "\n".join(lines)

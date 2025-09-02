from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from app.models import Task, Sample, TaskState, Brief, Project, Review, DecisionLog, DoD

def compute_kpis(session: Session):
    tasks = session.exec(select(Task)).all()
    projects = session.exec(select(Project)).all()
    reviews = session.exec(select(Review)).all()
    decision_logs = session.exec(select(DecisionLog)).all()
    
    if not tasks:
        return dict(
            # Core KPIs
            rework_rate=0.0,
            context_switches_per_day=0.0,
            dod_adherence=0.0,
            sample_validation_rate=0.0,
            brief_completion_rate=0.0,
            
            # Additional metrics
            dod_definition_rate=0.0,
            avg_project_completion=0.0,
            
            # Counts
            total_projects=len(projects),
            total_tasks=0,
            total_reviews=len(reviews),
            total_decisions=len(decision_logs),
            
            # Task state distribution
            task_states={
                "backlog": 0,
                "in_progress": 0,
                "done": 0,
                "paused": 0,
                "canceled": 0
            },
            
            # Recent activity (last 7 days)
            recent_tasks=0,
            recent_reviews=len(reviews),
            recent_decisions=len(decision_logs),
        )

    # rework rate: tasks with rework_count > 0 over done+in-progress
    relevant = [t for t in tasks if t.state in (TaskState.DONE, TaskState.IN_PROGRESS)]
    rework_tasks = [t for t in relevant if t.rework_count > 0]
    rework_rate = len(rework_tasks) / len(relevant) if relevant else 0.0

    # context switches/day: average over last 7 days (approx: using all-time / days since created)
    now = datetime.now()  # timezone-naive datetime to match created_at
    total_days = 0.0
    total_switches = 0
    for t in tasks:
        days = max((now - t.created_at).days, 1)
        total_days += days
        total_switches += t.context_switch_count
    context_switches_per_day = total_switches / total_days if total_days else 0.0

    # DoD adherence
    dod_true = [t for t in tasks if t.dod_checked]
    dod_adherence = len(dod_true) / len(tasks) if tasks else 0.0

    # sample validation rate: samples approved / samples total
    samples = session.exec(select(Sample)).all()
    approved = [s for s in samples if s.approved]
    sample_validation_rate = (len(approved) / len(samples)) if samples else 0.0

    # 5SB (Brief) completion rate: tasks that have a Brief / total tasks
    task_ids = {t.id for t in tasks}
    briefs = session.exec(select(Brief)).all()
    brief_task_ids = {b.task_id for b in briefs}
    brief_completion_rate = (len(task_ids & brief_task_ids) / len(task_ids)) if task_ids else 0.0

    # Additional statistics
    dods = session.exec(select(DoD)).all()
    
    # Task state distribution
    state_counts = {
        "backlog": len([t for t in tasks if t.state == TaskState.BACKLOG]),
        "in_progress": len([t for t in tasks if t.state == TaskState.IN_PROGRESS]),
        "done": len([t for t in tasks if t.state == TaskState.DONE]),
        "paused": len([t for t in tasks if t.state == TaskState.PAUSED]),
        "canceled": len([t for t in tasks if t.state == TaskState.CANCELED])
    }
    
    # Project completion rate
    project_completion_rates = []
    for project in projects:
        project_tasks = [t for t in tasks if t.project_id == project.id]
        if project_tasks:
            done_tasks = [t for t in project_tasks if t.state == TaskState.DONE]
            completion_rate = len(done_tasks) / len(project_tasks)
            project_completion_rates.append(completion_rate)
    
    avg_project_completion = sum(project_completion_rates) / len(project_completion_rates) if project_completion_rates else 0.0
    
    # DoD completion rate (tasks with DoD defined)
    dod_task_ids = {d.task_id for d in dods}
    dod_definition_rate = len(dod_task_ids & task_ids) / len(task_ids) if task_ids else 0.0
    
    return dict(
        # Core KPIs
        rework_rate=round(rework_rate, 3),
        context_switches_per_day=round(context_switches_per_day, 3),
        dod_adherence=round(dod_adherence, 3),
        sample_validation_rate=round(sample_validation_rate, 3),
        brief_completion_rate=round(brief_completion_rate, 3),
        
        # Additional metrics
        dod_definition_rate=round(dod_definition_rate, 3),
        avg_project_completion=round(avg_project_completion, 3),
        
        # Counts
        total_projects=len(projects),
        total_tasks=len(tasks),
        total_reviews=len(reviews),
        total_decisions=len(decision_logs),
        
        # Task state distribution
        task_states=state_counts,
        
        # Recent activity (last 7 days)
        recent_tasks=len([t for t in tasks if (now - t.created_at).days <= 7]),
        recent_reviews=len([r for r in reviews if (now - r.created_at).days <= 7]),
        recent_decisions=len([d for d in decision_logs if (now - d.created_at).days <= 7]),
    )

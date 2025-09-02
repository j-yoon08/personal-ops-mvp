# Personal Ops MVP

A minimal **FastAPI + SQLModel** project implementing your personal execution framework:

- WIP limit (in-progress tasks ≤ 3)
- 5-Sentence Brief (5SB)
- Definition of Done (DoD)
- Decision Log with D+7 review
- Premortem / Mid-mortem / Retrospective
- 10% Sample-first workflow
- KPIs dashboard (Rework rate, Context switches/day, DoD adherence, etc.)
- Markdown export of project/task packages

## Quick Start

```bash
# 1) Create venv and install deps
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2) Run server
uvicorn app.main:app --reload

# 3) Open docs
# http://127.0.0.1:8000/docs
```

## Project Structure

```
backend/
  app/
    main.py
    core/config.py
    db/session.py
    db/init_db.py
    models.py
    schemas.py
    services/kpi.py
    export/markdown.py
    routers/
      projects.py
      tasks.py
      briefs.py
      dod.py
      decisions.py
      reviews.py
      samples.py
      exports.py
      dashboard.py
frontend_stub/
  index.html
```

## Notes

- Default WIP limit is 3. You can change it via `core/config.py` (ENV support included).
- KPIs are computed from stored events and task states.
- Exports produce Markdown bundles suitable for README/blog/Notion import.

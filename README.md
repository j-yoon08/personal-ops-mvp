# Personal Ops MVP

개인 업무 관리 시스템 - WIP 제한, 5SB, DoD, KPI 대시보드를 통한 생산성 최적화

![Personal Ops MVP](https://img.shields.io/badge/version-1.0.0-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

## 🌟 주요 특징

- **WIP 제한**: 동시 진행 작업을 3개로 제한하여 집중력 최적화
- **5SB (5-Sentence Brief)**: 목적, 성공기준, 제약사항, 우선순위, 검증방법 체계화  
- **DoD (Definition of Done)**: 명확한 완료 기준과 품질 게이트
- **Decision Log + D+7 리뷰**: 의사결정 추적 및 7일 후 재검토
- **Review 시스템**: Premortem, Midmortem, Retrospective
- **10% 샘플링**: 샘플 우선 워크플로우
- **실시간 KPI**: 리워크율, 컨텍스트 스위치, DoD 준수율, 샘플 승인율
- **마크다운 내보내기**: 프로젝트 전체를 README/블로그/Notion용으로 출력

## 🏗️ 기술 스택

### Backend
- **FastAPI** - 고성능 Python API 프레임워크
- **SQLModel** - SQLAlchemy + Pydantic 통합 ORM
- **SQLite** - 경량 데이터베이스
- **Uvicorn** - ASGI 서버

### Frontend  
- **Next.js 14** - React 풀스택 프레임워크 (App Router)
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **shadcn/ui** - 고품질 React 컴포넌트
- **TanStack Query** - 서버 상태 관리
- **React Hook Form + Zod** - 폼 관리 및 검증
- **Sonner** - Toast 알림 시스템

## 🚀 빠른 시작

### 1. 레포지토리 클론
```bash
git clone <repository-url>
cd personal-ops-mvp
```

### 2. 백엔드 설정 및 실행
```bash
cd backend

# 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload
```

### 3. 프론트엔드 설정 및 실행 (새 터미널)
```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. 접속
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://127.0.0.1:8000  
- **API 문서**: http://127.0.0.1:8000/docs

## 📚 사용법 가이드

### 기본 워크플로우

#### 1️⃣ **프로젝트 생성**
```bash
# 웹 UI에서 "새 프로젝트" 버튼 클릭
# 또는 API 직접 호출:
curl -X POST "http://127.0.0.1:8000/projects" \
-H "Content-Type: application/json" \
-d '{"name": "Capstone v2", "description": "졸업 프로젝트"}'
```

#### 2️⃣ **작업 생성**  
```bash
# 웹 UI에서 "새 작업" 버튼 클릭
# 또는 API 직접 호출:
curl -X POST "http://127.0.0.1:8000/tasks" \
-H "Content-Type: application/json" \
-d '{"project_id": 1, "title": "데이터베이스 설계", "priority": 2}'
```

#### 3️⃣ **5SB 작성**
```bash
curl -X POST "http://127.0.0.1:8000/briefs" \
-H "Content-Type: application/json" \
-d '{
  "task_id": 1,
  "purpose": "사용자 인증 시스템 구현",
  "success_criteria": "로그인/회원가입 기능 완성", 
  "constraints": "2주 내 완료, JWT 사용",
  "priorities": "보안성 우선",
  "validation_method": "테스트 코드 작성"
}'
```

#### 4️⃣ **DoD 설정**
```bash
curl -X POST "http://127.0.0.1:8000/dod" \
-H "Content-Type: application/json" \
-d '{
  "task_id": 1,
  "deliverable_formats": "MD,CODE",
  "mandatory_checks": ["코드 리뷰", "테스트 통과", "문서화", "보안 검토", "배포 테스트"],
  "quality_bar": "테스트 커버리지 80% 이상",
  "verification": "샘플 10개, 리뷰 1회"
}'
```

#### 5️⃣ **작업 상태 변경 (WIP 제한 적용)**
```bash
# BACKLOG → IN_PROGRESS (최대 3개 제한)
curl -X PATCH "http://127.0.0.1:8000/tasks/1/state" \
-H "Content-Type: application/json" \
-d '{"state": "IN_PROGRESS"}'

# IN_PROGRESS → DONE  
curl -X PATCH "http://127.0.0.1:8000/tasks/1/state" \
-H "Content-Type: application/json" \
-d '{"state": "DONE"}'
```

### 고급 기능

#### 🤔 **의사결정 로그 + D+7 리뷰**
```bash
# 의사결정 기록
curl -X POST "http://127.0.0.1:8000/decisions" \
-H "Content-Type: application/json" \
-d '{
  "task_id": 1,
  "date": "2024-01-15",
  "problem": "데이터베이스 선택",
  "options": "MySQL vs PostgreSQL", 
  "decision_reason": "PostgreSQL 선택 - JSON 지원 우수",
  "assumptions_risks": "학습 곡선, 운영 복잡도"
}'

# 7일 후 리뷰
curl -X PATCH "http://127.0.0.1:8000/decisions/1/dplus7" \
-H "Content-Type: application/json" \
-d '{"d_plus_7_review": "좋은 선택이었음. 성능 우수"}'
```

#### 🔍 **리뷰 시스템**
```bash
# Premortem (사전 위험 분석)
curl -X POST "http://127.0.0.1:8000/reviews" \
-H "Content-Type: application/json" \
-d '{
  "task_id": 1,
  "review_type": "PREMORTEM",
  "positives": "명확한 요구사항, 충분한 시간",
  "negatives": "외부 API 의존성 위험", 
  "changes_next": "백업 플랜 준비"
}'

# Midmortem (중간 점검)
curl -X POST "http://127.0.0.1:8000/reviews" \
-H "Content-Type: application/json" \
-d '{
  "task_id": 1,
  "review_type": "MIDMORTEM",
  "positives": "진행 순조",
  "negatives": "일정 지연",
  "changes_next": "리소스 추가 투입"
}'

# Retrospective (회고)  
curl -X POST "http://127.0.0.1:8000/reviews" \
-H "Content-Type: application/json" \
-d '{
  "task_id": 1,
  "review_type": "RETRO",
  "positives": "목표 달성, 품질 우수",
  "negatives": "문서화 부족",
  "changes_next": "문서화 프로세스 개선"
}'
```

#### 📊 **10% 샘플링**
```bash
curl -X POST "http://127.0.0.1:8000/samples" \
-H "Content-Type: application/json" \
-d '{
  "task_id": 1,
  "proportion": 0.1,
  "notes": "초기 프로토타입 검토",
  "approved": true
}'
```

## 📊 KPI 대시보드

### 실시간 모니터링 지표
- **리워크율**: 재작업이 필요한 작업 비율
- **컨텍스트 스위치/일**: 하루 평균 작업 전환 횟수
- **DoD 준수율**: 완료 기준을 준수한 작업 비율  
- **샘플 승인율**: 10% 샘플 중 승인된 비율

### KPI 조회
```bash
curl "http://127.0.0.1:8000/dashboard/kpi"
```

## 📤 마크다운 내보내기

프로젝트 전체를 마크다운 형태로 내보내기:
```bash
curl "http://127.0.0.1:8000/exports/project/1/md" > project_export.md
```

생성된 마크다운 파일 활용:
- 📝 **README 파일** 생성
- 📚 **블로그 포스트** 작성  
- 📋 **Notion 페이지** 생성
- 🎯 **포트폴리오** 자료

## 🔄 권장 작업 사이클

```
1. 프로젝트 생성
2. 작업 생성  
3. 5SB 작성 (목적 명확화)
4. DoD 설정 (완료 기준)
5. Premortem (위험 분석)
6. 작업 시작 (IN_PROGRESS)
7. 10% 샘플링 (중간 검증)
8. 의사결정 로그 (중요 결정)
9. Midmortem (중간 점검)
10. 작업 완료 (DONE)
11. Retrospective (회고)
12. D+7 리뷰 (결정 재검토)  
13. 마크다운 내보내기
```

## 📁 프로젝트 구조

```
personal-ops-mvp/
├── backend/                    # FastAPI 백엔드
│   ├── app/
│   │   ├── core/              # 설정 파일
│   │   ├── db/                # 데이터베이스 연결
│   │   ├── models.py          # SQLModel 데이터 모델
│   │   ├── schemas.py         # Pydantic 스키마
│   │   ├── routers/           # API 라우터들
│   │   ├── services/          # 비즈니스 로직 (KPI 계산 등)
│   │   ├── export/            # 마크다운 내보내기
│   │   └── main.py            # FastAPI 앱
│   ├── requirements.txt
│   └── personal_ops.db        # SQLite 데이터베이스
│
├── frontend/                   # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   │   └── dialogs/      # 모달 다이얼로그들
│   │   ├── hooks/            # React Query 훅들
│   │   ├── services/         # API 클라이언트
│   │   ├── types/            # TypeScript 타입 정의
│   │   └── lib/              # 유틸리티 함수들
│   ├── package.json
│   └── .env.local            # 환경 변수
│
└── README.md
```

## 🛡️ 보안 및 설정

### 환경 변수 설정
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# backend/.env (선택사항)
DATABASE_URL=sqlite:///./personal_ops.db
WIP_LIMIT=3
```

### CORS 설정
백엔드는 다음 Origin들을 허용합니다:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

## 🔧 개발 및 배포

### 개발 모드
```bash
# 백엔드 (자동 리로드)
uvicorn app.main:app --reload

# 프론트엔드 (자동 리로드) 
npm run dev
```

### 프로덕션 빌드
```bash
# 프론트엔드 빌드
cd frontend
npm run build
npm start

# 백엔드 프로덕션 실행
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 📈 확장 로드맵

### Phase 1: 현재 구현됨
- ✅ WIP 제한 시스템
- ✅ 5SB + DoD + KPI 대시보드  
- ✅ Decision Log + D+7 리뷰
- ✅ Review 시스템 (Pre/Mid/Retro)
- ✅ 10% 샘플링
- ✅ 마크다운 내보내기

### Phase 2: 향후 계획
- 🔄 **컨텍스트 스위칭 자동 집계**: 작업 전환 시 자동 카운트
- 🔄 **리워크 자동 측정**: 파일 수정 횟수 기반 리워크율 계산
- 📱 **모바일 앱**: 알림 및 간편 상태 업데이트
- 🔔 **알림 시스템**: D+7 리뷰 자동 리마인더
- 🔗 **외부 연동**: Notion API, GitHub 릴리스, Slack 알림

## 🤝 기여하기

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 감사

- [FastAPI](https://fastapi.tiangolo.com/) - 모던 Python API 프레임워크
- [Next.js](https://nextjs.org/) - React 풀스택 프레임워크  
- [shadcn/ui](https://ui.shadcn.com/) - 아름다운 UI 컴포넌트
- [TanStack Query](https://tanstack.com/query) - 강력한 데이터 동기화

---

**Personal Ops MVP**로 개인 생산성을 최적화하세요! 🚀
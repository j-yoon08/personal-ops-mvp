#!/usr/bin/env python3
"""
데이터베이스 초기화 스크립트
테이블 생성 및 기본 설정
"""
import os
import sys
from pathlib import Path

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import SQLModel, create_engine
from app.core.config import settings
from app.models import *

def init_database():
    """데이터베이스 초기화 - 테이블 생성"""
    print(f"🗄️  데이터베이스 초기화 시작...")
    print(f"   Database URL: {settings.DATABASE_URL}")
    
    # 엔진 생성
    engine = create_engine(settings.DATABASE_URL, echo=True)
    
    # 모든 테이블 생성
    print("📋 테이블 생성 중...")
    SQLModel.metadata.create_all(engine)
    
    print("✅ 데이터베이스 초기화 완료!")
    print("\n생성된 테이블:")
    print("  - users (사용자)")
    print("  - projects (프로젝트)")
    print("  - tasks (작업)")
    print("  - briefs (5SB)")
    print("  - dods (DoD)")
    print("  - reviews (리뷰)")
    print("  - decisionlogs (의사결정)")
    print("  - samples (샘플)")
    print("  - notifications (알림)")
    print("  - templates (템플릿)")
    print("  - 협업 관련 테이블들")
    
    # 데이터베이스 파일 위치 확인
    if settings.DATABASE_URL.startswith("sqlite"):
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        if os.path.exists(db_path):
            file_size = os.path.getsize(db_path)
            print(f"\n📊 데이터베이스 파일: {db_path}")
            print(f"   크기: {file_size:,} bytes")

def check_database():
    """데이터베이스 상태 확인"""
    from sqlmodel import Session, select
    
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as session:
        # 각 테이블의 레코드 수 확인
        tables = [
            ("사용자", User),
            ("프로젝트", Project),
            ("작업", Task),
            ("5SB", Brief),
            ("DoD", DoD),
            ("리뷰", Review),
            ("의사결정", DecisionLog),
            ("템플릿", Template),
            ("알림", Notification)
        ]
        
        print("\n📊 데이터베이스 현황:")
        for name, model in tables:
            try:
                count = len(session.exec(select(model)).all())
                print(f"   {name}: {count}개")
            except Exception as e:
                print(f"   {name}: 확인 불가 ({e})")

if __name__ == "__main__":
    init_database()
    check_database()
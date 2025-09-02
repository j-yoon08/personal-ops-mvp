from sqlmodel import SQLModel, create_engine, Session
from . import init_db
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)

def get_session():
    with Session(engine) as session:
        yield session

def init():
    SQLModel.metadata.create_all(engine)

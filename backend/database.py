"""
database.py — SQLAlchemy setup for Croply
Default: SQLite (file-based, zero setup)
Switch to PostgreSQL: set DATABASE_URL env var to postgresql://...
"""
from dotenv import load_dotenv
load_dotenv()

import os
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, String, Boolean, Float,
    Text, DateTime, ForeignKey, Integer
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ── Connection ────────────────────────────────────────────────────────────────
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./croply.db"   # default: local file next to main.py
)

# SQLite needs check_same_thread=False; harmless on other engines
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(String, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=True)   # nullable for guests
    phone         = Column(String, default="")
    password_hash = Column(String, nullable=True)                             # null for guests
    is_guest      = Column(Boolean, default=False)
    created_at    = Column(DateTime, default=datetime.utcnow)
    last_seen_at  = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    user_id    = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    session_id = Column(String, index=True)          # browser session / tab
    bot_type   = Column(String, default="navbot")    # "navbot" | "kisanbot"
    role       = Column(String, nullable=False)       # "user" | "bot"
    message    = Column(Text, nullable=False)
    language   = Column(String, default="en")        # "en" | "hi"
    # Optional scan context stored as JSON string
    disease    = Column(String, nullable=True)
    crop       = Column(String, nullable=True)
    severity   = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Init ──────────────────────────────────────────────────────────────────────
def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
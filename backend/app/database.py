import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "vidhiscan.db").replace("\\", "/")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

# Handle standard postgres:// scheme if provided by cloud providers
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_sqlite_migrations():
    """
    Safely adds any missing columns to existing SQLite tables without losing existing data.
    """
    if "sqlite" not in DATABASE_URL:
        return

    with engine.connect() as conn:
        # Check product_registry columns
        try:
            res = conn.execute(text("PRAGMA table_info(product_registry)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                if "category" not in cols:
                    conn.execute(text("ALTER TABLE product_registry ADD COLUMN category VARCHAR DEFAULT 'Packaged Goods'"))
                if "company_id" not in cols:
                    conn.execute(text("ALTER TABLE product_registry ADD COLUMN company_id INTEGER"))
                conn.commit()
        except Exception as e:
            print(f"[Migration Warning] product_registry: {e}")

        # Check scan_reports columns
        try:
            res = conn.execute(text("PRAGMA table_info(scan_reports)"))
            cols = [row[1] for row in res.fetchall()]
            if cols:
                if "company_id" not in cols:
                    conn.execute(text("ALTER TABLE scan_reports ADD COLUMN company_id INTEGER"))
                conn.commit()
        except Exception as e:
            print(f"[Migration Warning] scan_reports: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

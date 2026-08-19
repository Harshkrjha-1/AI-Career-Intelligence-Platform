from database import engine, SessionLocal
from sqlalchemy import text

def inspect_db():
    db = SessionLocal()
    try:
        print("=== CHECKING POSTGRESQL TABLES ===")
        tables = ["users", "profiles", "resumes", "resume_history", "resume_analysis"]
        for table in tables:
            try:
                res = db.execute(text(f"SELECT COUNT(*) FROM {table}")).fetchone()
                print(f"Table '{table}': {res[0]} rows")
            except Exception as e:
                print(f"Table '{table}' error: {e}")
                
        print("\n=== ACTIVE RESUMES ===")
        try:
            active_res = db.execute(text("SELECT id, user_id, file_name, version, is_active FROM resumes WHERE is_active = 1")).fetchall()
            print(f"Active Resumes in 'resumes': {active_res}")
        except Exception as e:
            print(f"Resumes check error: {e}")

        try:
            active_hist = db.execute(text("SELECT id, user_id, file_name, version, is_active FROM resume_history WHERE is_active = 1")).fetchall()
            print(f"Active Resumes in 'resume_history': {active_hist}")
        except Exception as e:
            print(f"Resume history check error: {e}")

        try:
            analyses = db.execute(text("SELECT id, user_id, name, resume_score, ats_score, parser_status FROM resume_analysis")).fetchall()
            print(f"Resume Analyses in 'resume_analysis': {analyses}")
        except Exception as e:
            print(f"Resume analysis check error: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    inspect_db()

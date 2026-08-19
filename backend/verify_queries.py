from database import SessionLocal
from sqlalchemy import text

def verify_queries():
    db = SessionLocal()
    try:
        user_id = 2
        print(f"=== POSTGRESQL VERIFICATION QUERIES FOR USER_ID = {user_id} ===")

        print("\n1. Active Resume Query (SELECT * FROM resume_history WHERE user_id=? AND is_active=true):")
        active = db.execute(text("SELECT id, user_id, resume_id, version, original_filename, stored_filename, file_path, upload_time, resume_score, parser_status, is_active FROM resume_history WHERE user_id=:uid AND is_active=1"), {"uid": user_id}).fetchall()
        for a in active:
            print("  ", dict(a._mapping))

        print("\n2. Resume History Query (SELECT * FROM resume_history WHERE user_id=? ORDER BY version DESC):")
        history = db.execute(text("SELECT id, user_id, resume_id, version, original_filename, stored_filename, file_path, upload_time, resume_score, parser_status, is_active FROM resume_history WHERE user_id=:uid ORDER BY version DESC LIMIT 5"), {"uid": user_id}).fetchall()
        for h in history:
            print("  ", dict(h._mapping))

        print("\n3. Parsed Data Query (SELECT * FROM resume_analysis WHERE user_id=?):")
        analysis = db.execute(text("SELECT id, user_id, resume_id, name, email, phone, resume_score, ats_score, parser_status FROM resume_analysis WHERE user_id=:uid"), {"uid": user_id}).fetchall()
        for an in analysis:
            print("  ", dict(an._mapping))

        print("\n4. Resume List Query (SELECT * FROM resumes WHERE user_id=?):")
        resumes = db.execute(text("SELECT id, user_id, file_name, file_path, file_size, version, is_active, uploaded_at FROM resumes WHERE user_id=:uid ORDER BY version DESC LIMIT 5"), {"uid": user_id}).fetchall()
        for r in resumes:
            print("  ", dict(r._mapping))

    finally:
        db.close()

if __name__ == "__main__":
    verify_queries()

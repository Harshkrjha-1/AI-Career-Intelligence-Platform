from database import SessionLocal, engine
from models import User, Resume, ResumeHistory, ResumeAnalysis
from sqlalchemy import text
from datetime import datetime

def populate_missing_history():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for u in users:
            print(f"Syncing user_id: {u.id} ({u.email})")
            user_resumes = db.query(Resume).filter(Resume.user_id == u.id).order_by(Resume.id.asc()).all()
            if not user_resumes:
                continue

            analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.user_id == u.id).first()
            score = analysis.resume_score if analysis else 85

            # Reset version numbers & history for user
            version_counter = 1
            max_idx = len(user_resumes) - 1

            for idx, r in enumerate(user_resumes):
                r.version = idx + 1
                is_act = 1 if idx == max_idx else 0
                r.is_active = is_act

                # Check if history already exists
                hist = db.query(ResumeHistory).filter(ResumeHistory.user_id == u.id, ResumeHistory.resume_id == r.id).first()
                if not hist:
                    hist = ResumeHistory(
                        user_id=u.id,
                        resume_id=r.id,
                        version=idx + 1,
                        original_filename=r.file_name,
                        stored_filename=r.file_name,
                        file_name=r.file_name,
                        file_path=r.file_path,
                        action="Uploaded",
                        is_active=is_act,
                        parser_status="Parsed",
                        resume_score=score,
                        summary=analysis.summary if analysis else "AI Resume Summary Parsed",
                        upload_time=r.uploaded_at or datetime.utcnow(),
                        created_at=r.uploaded_at or datetime.utcnow()
                    )
                    db.add(hist)
                else:
                    hist.version = idx + 1
                    hist.is_active = is_act

            # Ensure resume_analysis points to the active resume
            active_r = user_resumes[-1]
            if analysis:
                analysis.resume_id = active_r.id
                analysis.parser_status = "Parsed"

        db.commit()
        print("Successfully synchronized resumes & resume_history in PostgreSQL!")
    except Exception as e:
        db.rollback()
        print("Error during population:", e)
    finally:
        db.close()

if __name__ == "__main__":
    populate_missing_history()

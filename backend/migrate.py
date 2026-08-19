from database import engine
from sqlalchemy import text

def run_migrations():
    migrations = [
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github VARCHAR(255);",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin VARCHAR(255);",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS projects JSON DEFAULT '[]';",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications JSON DEFAULT '[]';",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS career_interests JSON DEFAULT '[]';",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500);",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professional_summary TEXT;",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS education JSON DEFAULT '[]';",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSON DEFAULT '[]';",
        "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience JSON DEFAULT '[]';",
        
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;",
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;",
        "ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1;",
        
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS resume_id INTEGER;",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS stored_filename VARCHAR(255);",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS action VARCHAR(50) DEFAULT 'Uploaded';",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1;",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS parser_status VARCHAR(50) DEFAULT 'Parsed';",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS resume_score INTEGER DEFAULT 70;",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS summary TEXT;",
        "ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",

        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS resume_id INTEGER;",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS name VARCHAR(255);",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS email VARCHAR(255);",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS phone VARCHAR(50);",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS projects JSON DEFAULT '[]';",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS certifications JSON DEFAULT '[]';",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS resume_summary TEXT;",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS ats_score INTEGER DEFAULT 75;",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS skill_gap_json JSON DEFAULT '{}';",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS salary_prediction_json JSON DEFAULT '{}';",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS career_recommendation_json JSON DEFAULT '[]';",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS career_roadmap_json JSON DEFAULT '{}';",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS parser_status VARCHAR(50) DEFAULT 'Parsed';",
        "ALTER TABLE resume_analysis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",

        # ── Resume Builder Drafts table (new — pure addition) ────────────────
        """
        CREATE TABLE IF NOT EXISTS resume_builder_drafts (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            draft_json JSON    NOT NULL DEFAULT '{}',
            template   VARCHAR(50) NOT NULL DEFAULT 'modern',
            saved_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT resume_builder_drafts_user_unique UNIQUE (user_id)
        );
        """,

        # ── Live Opportunities cache table (new — pure addition) ─────────────
        """
        CREATE TABLE IF NOT EXISTS opportunity_cache (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            source     VARCHAR(50) NOT NULL,
            raw_json   JSON NOT NULL DEFAULT '[]',
            fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL
        );
        """,

        # ── Job Recommendations cache table (new — pure addition) ───────────
        """
        CREATE TABLE IF NOT EXISTS job_recommendation_cache (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            source     VARCHAR(50) NOT NULL,
            raw_json   JSON NOT NULL DEFAULT '[]',
            fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL
        );
        """,
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin INTEGER DEFAULT 0;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended INTEGER DEFAULT 0;",
        """
        CREATE TABLE IF NOT EXISTS platform_activity_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action_text TEXT NOT NULL,
            category VARCHAR(50) DEFAULT 'system',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS user_feedback_tickets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            user_name VARCHAR(255),
            category VARCHAR(100) DEFAULT 'General',
            message TEXT NOT NULL,
            response_text TEXT,
            status VARCHAR(50) DEFAULT 'Open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS system_alerts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            category VARCHAR(50) DEFAULT 'info',
            is_unread INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    ]

    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        for query in migrations:
            try:
                conn.execute(text(query))
            except Exception as e:
                print(f"Migration query error: {e}")

    with engine.connect() as conn:
        db_name = conn.execute(text("SELECT current_database();")).fetchone()[0]
        cols = [c[0] for c in conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'resume_analysis';")).fetchall()]
        print(f"MIGRATION COMPLETE ON DATABASE: {db_name}")
        print(f"RESUME_ANALYSIS COLUMNS ({len(cols)} total):", cols)

    # Seed Admin User and Initial Platform Data
    seed_admin_user()
    seed_initial_admin_data()

def seed_admin_user():
    from database import SessionLocal
    from models import User
    from auth import get_password_hash
    
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.is_admin == 1).first()
        if not admin_exists:
            admin_user = db.query(User).filter(User.email == "admin@careerintel.com").first()
            if admin_user:
                admin_user.is_admin = 1
                db.commit()
                print("Promoted existing user admin@careerintel.com to Admin.")
            else:
                new_admin = User(
                    name="Platform Admin",
                    email="admin@careerintel.com",
                    password_hash=get_password_hash("AdminPassword123"),
                    is_admin=1
                )
                db.add(new_admin)
                db.commit()
                print("Created default admin user: admin@careerintel.com / AdminPassword123")
        else:
            print(f"Admin user already exists: {admin_exists.email}")
    except Exception as e:
        print(f"Error seeding admin user: {e}")
        db.rollback()
    finally:
        db.close()

def seed_initial_admin_data():
    from database import SessionLocal
    from models import SystemAlert, UserFeedbackTicket, PlatformActivityLog
    
    db = SessionLocal()
    try:
        # Check alerts
        if db.query(SystemAlert).count() == 0:
            alerts = [
                SystemAlert(title="Parse failure spike detected", message="12 DOCX files failed in last hour — possible schema change", category="error", is_unread=1),
                SystemAlert(title="Adzuna API response time elevated", message="Avg latency 1,840ms — exceeds 1,500ms threshold", category="warning", is_unread=1),
                SystemAlert(title="Daily resume parse batch completed", message="892 resumes processed · 97.8% success rate", category="info", is_unread=0),
                SystemAlert(title="143 new user registrations this week", message="Highest weekly growth since platform launch", category="info", is_unread=0),
                SystemAlert(title="3 feedback tickets unresolved > 48 hrs", message="Users: Riya Sharma, Dev Patel, Ananya Roy", category="error", is_unread=1)
            ]
            db.bulk_save_objects(alerts)
            print("Seeded system alerts.")

        # Check tickets
        if db.query(UserFeedbackTicket).count() == 0:
            tickets = [
                UserFeedbackTicket(user_name="Riya Sharma", category="Resume Parsing", status="Open", message="I uploaded my docx resume but my project dates got parsed incorrectly."),
                UserFeedbackTicket(user_name="Dev Patel", category="ATS Score Query", status="Open", message="Why is my ATS score 45%? I have listed all skills in detail."),
                UserFeedbackTicket(user_name="Ananya Roy", category="Course Link Broken", status="Pending", message="The Udemy link for MLOps points to search page instead of course page."),
                UserFeedbackTicket(user_name="Karan Mehta", category="Feature Request", status="Resolved", response_text="Thanks for the feedback! We have successfully integrated the Resume PDF Export feature.", message="Can you add a way to export resumes to PDF? Thanks.")
            ]
            db.bulk_save_objects(tickets)
            print("Seeded user feedback tickets.")

        # Check activity logs
        if db.query(PlatformActivityLog).count() == 0:
            logs = [
                PlatformActivityLog(action_text="Harsh Kumar Jha uploaded resume v7", category="resume"),
                PlatformActivityLog(action_text="Aditya Patel registered a new account", category="auth"),
                PlatformActivityLog(action_text="Parse failure — resume_draft_riya.docx", category="system"),
                PlatformActivityLog(action_text="892 resumes processed in daily batch", category="system"),
                PlatformActivityLog(action_text="Admin login — Super Admin", category="auth")
            ]
            db.bulk_save_objects(logs)
            print("Seeded platform activity logs.")

        db.commit()
    except Exception as e:
        print(f"Error seeding initial admin data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_migrations()

import os
import sys
from sqlalchemy import text

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from app.models.database import Base

def reset_database():
    print("Dropping public schema cascade...")
    try:
        with engine.connect() as conn:
            # Transaction blocks
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            conn.commit()
        print("Schema dropped and recreated successfully.")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("All database tables created successfully matching the schema!")
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()

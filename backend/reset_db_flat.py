import os
import sys
from sqlalchemy import text

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from models import Base

def reset_database():
    print("Dropping public schema cascade in PostgreSQL...")
    try:
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE;"))
            conn.execute(text("CREATE SCHEMA public;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            conn.commit()
        print("Schema dropped and recreated successfully.")
        
        # Recreate tables matching the flat models
        Base.metadata.create_all(bind=engine)
        print("All database tables created successfully matching the new flat schemas!")
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_database()

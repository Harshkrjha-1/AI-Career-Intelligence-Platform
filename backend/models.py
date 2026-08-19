from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Float, Text
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_admin = Column(Integer, default=0, server_default="0")
    is_suspended = Column(Integer, default=0, server_default="0")
    created_at = Column(DateTime, server_default=func.now())

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    github = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    education = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    career_interests = Column(JSON, default=list)
    profile_picture = Column(String(500), nullable=True)
    profile_photo = Column(String(500), nullable=True)
    professional_summary = Column(Text, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    version = Column(Integer, default=1)
    is_active = Column(Integer, default=1)
    uploaded_at = Column(DateTime, server_default=func.now())

class ResumeHistory(Base):
    __tablename__ = "resume_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    version = Column(Integer, default=1)
    original_filename = Column(String(255), nullable=True)
    stored_filename = Column(String(255), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=False)
    action = Column(String(50), default="Uploaded") # Uploaded, Replaced, Deleted, Restored
    is_active = Column(Integer, default=1)
    parser_status = Column(String(50), default="Parsed")
    resume_score = Column(Integer, default=70)
    summary = Column(Text, nullable=True)
    upload_time = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

class ResumeAnalysis(Base):
    __tablename__ = "resume_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    education = Column(JSON, default=list)
    skills = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    resume_summary = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    resume_score = Column(Integer, default=70)
    ats_score = Column(Integer, default=75)
    skill_gap_json = Column(JSON, default=dict)
    salary_prediction_json = Column(JSON, default=dict)
    career_recommendation_json = Column(JSON, default=list)
    career_roadmap_json = Column(JSON, default=dict)
    parser_status = Column(String(50), default="Parsed")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class SkillGap(Base):
    __tablename__ = "skill_gap"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    recommended_skills = Column(JSON, default=list)

class SalaryPrediction(Base):
    __tablename__ = "salary_prediction"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(255), nullable=False)
    min_salary = Column(Float, default=0.0)
    max_salary = Column(Float, default=0.0)
    confidence = Column(Float, default=0.85)
    created_at = Column(DateTime, server_default=func.now())

class ResumeBuilderDraft(Base):
    """Stores the Resume Builder form state per user (one draft per user, upserted)."""
    __tablename__ = "resume_builder_drafts"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    draft_json = Column(JSON, default=dict)   # full builder form state
    template   = Column(String(50), default="modern")
    saved_at   = Column(DateTime, server_default=func.now(), onupdate=func.now())

class OpportunityCache(Base):
    """Caches fetched Live Opportunities results per user per source for 24 hours."""
    __tablename__ = "opportunity_cache"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source     = Column(String(50), nullable=False)   # adzuna | devpost | jsearch
    raw_json   = Column(JSON, default=list)
    fetched_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)

class JobRecommendationCache(Base):
    """Caches fetched Job Recommendations for Dashboard for 24 hours."""
    __tablename__ = "job_recommendation_cache"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source     = Column(String(50), nullable=False)   # adzuna
    raw_json   = Column(JSON, default=list)
    fetched_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)

class PlatformActivityLog(Base):
    __tablename__ = "platform_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_text = Column(Text, nullable=False)
    category = Column(String(50), default="system") # resume, auth, system, profile
    created_at = Column(DateTime, server_default=func.now())

class UserFeedbackTicket(Base):
    __tablename__ = "user_feedback_tickets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_name = Column(String(255), nullable=True)
    category = Column(String(100), default="General") # Resume Parsing, ATS Score Query, Course Link Broken, Feature Request, General
    message = Column(Text, nullable=False)
    response_text = Column(Text, nullable=True)
    status = Column(String(50), default="Open") # Open, Pending, Resolved
    created_at = Column(DateTime, server_default=func.now())

class SystemAlert(Base):
    __tablename__ = "system_alerts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="info") # info, warning, error, critical
    is_unread = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())



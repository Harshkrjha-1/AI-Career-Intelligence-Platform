from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String(50), default="user") # user, admin
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    career_paths = relationship("CareerPath", back_populates="user", cascade="all, delete-orphan")
    salary_predictions = relationship("SalaryPrediction", back_populates="user", cascade="all, delete-orphan")
    learning_progress = relationship("LearningProgress", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    phone_number = Column(String(50), nullable=True)
    photo_url = Column(String(500), nullable=True)
    summary = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    industry = Column(String(255), nullable=True)
    experience_years = Column(Float, default=0.0)
    current_salary = Column(Float, nullable=True)
    target_salary = Column(Float, nullable=True)
    social_links = Column(JSON, default=dict) # {linkedin: "", github: "", portfolio: ""}
    
    user = relationship("User", back_populates="profile")
    education = relationship("Education", back_populates="profile", cascade="all, delete-orphan")
    experience = relationship("Experience", back_populates="profile", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="profile", cascade="all, delete-orphan")
    skills = relationship("Skill", back_populates="profile", cascade="all, delete-orphan")
    certifications = relationship("Certification", back_populates="profile", cascade="all, delete-orphan")


class Education(Base):
    __tablename__ = "education"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    institution = Column(String(255), nullable=False)
    degree = Column(String(255), nullable=False)
    field_of_study = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    profile = relationship("Profile", back_populates="education")


class Experience(Base):
    __tablename__ = "experience"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    company = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    is_current = Column(Boolean, default=False)
    
    profile = relationship("Profile", back_populates="experience")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    technologies = Column(JSON, default=list) # ["Python", "React"]
    link = Column(String(500), nullable=True)
    
    profile = relationship("Profile", back_populates="projects")


class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    proficiency = Column(String(50), default="intermediate") # beginner, intermediate, advanced
    
    profile = relationship("Profile", back_populates="skills")


class Certification(Base):
    __tablename__ = "certifications"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    issuing_organization = Column(String(255), nullable=False)
    issue_date = Column(String(50), nullable=True)
    expiration_date = Column(String(50), nullable=True)
    credential_url = Column(String(500), nullable=True)
    
    profile = relationship("Profile", back_populates="certifications")


class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # pdf, docx
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    version = Column(Integer, default=1)
    
    user = relationship("User", back_populates="resumes")
    parsed_data = relationship("ParsedResumeData", back_populates="resume", uselist=False, cascade="all, delete-orphan")


class ParsedResumeData(Base):
    __tablename__ = "parsed_resume_data"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), unique=True, nullable=False)
    raw_text = Column(Text, nullable=True)
    extracted_name = Column(String(255), nullable=True)
    extracted_email = Column(String(255), nullable=True)
    extracted_phone = Column(String(50), nullable=True)
    extracted_skills = Column(JSON, default=list)
    extracted_education = Column(JSON, default=list)
    extracted_experience = Column(JSON, default=list)
    extracted_projects = Column(JSON, default=list)
    extracted_certifications = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    resume = relationship("Resume", back_populates="parsed_data")


class CareerPath(Base):
    __tablename__ = "career_paths"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    path_title = Column(String(255), nullable=False)
    target_role = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    switch_probability = Column(Float, default=0.5)
    steps_json = Column(JSON, default=list) # roadmap nodes
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="career_paths")


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    experience_required = Column(Float, default=0.0)
    skills_required = Column(JSON, default=list)
    source = Column(String(100), default="LinkedIn")
    url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    progress_entries = relationship("LearningProgress", back_populates="job", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    provider = Column(String(255), nullable=True) # Coursera, Udemy, etc.
    description = Column(Text, nullable=True)
    skills_taught = Column(JSON, default=list)
    url = Column(String(500), nullable=True)
    rating = Column(Float, default=4.5)
    platform = Column(String(100), nullable=False) # coursera, udemy, youtube
    
    progress_entries = relationship("LearningProgress", back_populates="course", cascade="all, delete-orphan")


class SalaryPrediction(Base):
    __tablename__ = "salary_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_title = Column(String(255), nullable=False)
    predicted_salary = Column(Float, nullable=False)
    industry = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    experience_years = Column(Float, nullable=False)
    confidence_interval = Column(JSON, default=list) # [min, max]
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="salary_predictions")


class LearningProgress(Base):
    __tablename__ = "learning_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True) # Optional linking to target job
    status = Column(String(50), default="not_started") # not_started, in_progress, completed
    progress_percentage = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="learning_progress")
    course = relationship("Course", back_populates="progress_entries")
    job = relationship("Job", back_populates="progress_entries")

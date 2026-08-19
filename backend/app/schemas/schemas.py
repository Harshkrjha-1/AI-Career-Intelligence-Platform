from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

# Child schemas for Profile
class EducationSchema(BaseModel):
    id: Optional[int] = None
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ExperienceSchema(BaseModel):
    id: Optional[int] = None
    company: str
    role: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    is_current: bool = False

    class Config:
        from_attributes = True

class ProjectSchema(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    technologies: List[str] = []
    link: Optional[str] = None

    class Config:
        from_attributes = True

class SkillSchema(BaseModel):
    id: Optional[int] = None
    name: str
    proficiency: str = "intermediate" # beginner, intermediate, advanced

    class Config:
        from_attributes = True

class CertificationSchema(BaseModel):
    id: Optional[int] = None
    name: str
    issuing_organization: str
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None
    credential_url: Optional[str] = None

    class Config:
        from_attributes = True

# Profile Schemas
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    photo_url: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    experience_years: Optional[float] = None
    current_salary: Optional[float] = None
    target_salary: Optional[float] = None
    social_links: Optional[Dict[str, str]] = None
    
    education: Optional[List[EducationSchema]] = None
    experience: Optional[List[ExperienceSchema]] = None
    projects: Optional[List[ProjectSchema]] = None
    skills: Optional[List[SkillSchema]] = None
    certifications: Optional[List[CertificationSchema]] = None

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    photo_url: Optional[str] = None
    summary: Optional[str] = None
    location: Optional[str] = None
    industry: Optional[str] = None
    experience_years: float
    current_salary: Optional[float] = None
    target_salary: Optional[float] = None
    social_links: Dict[str, str] = {}
    
    education: List[EducationSchema] = []
    experience: List[ExperienceSchema] = []
    projects: List[ProjectSchema] = []
    skills: List[SkillSchema] = []
    certifications: List[CertificationSchema] = []

    class Config:
        from_attributes = True

# Resume Schemas
class ResumeResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    file_path: str
    file_type: str
    uploaded_at: datetime
    version: int

    class Config:
        from_attributes = True

class ParsedResumeDataResponse(BaseModel):
    id: int
    resume_id: int
    raw_text: Optional[str] = None
    extracted_name: Optional[str] = None
    extracted_email: Optional[str] = None
    extracted_phone: Optional[str] = None
    extracted_skills: List[str] = []
    extracted_education: List[Dict[str, Any]] = []
    extracted_experience: List[Dict[str, Any]] = []
    extracted_projects: List[Dict[str, Any]] = []
    extracted_certifications: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ResumeScoreResponse(BaseModel):
    score: int
    ats_compatibility: int
    grammar_score: int
    bullet_points_score: int
    feedback: List[str]
    missing_keywords: List[str]
    improvement_suggestions: List[Dict[str, str]]

# Career & Prediction Schemas
class CareerPathResponse(BaseModel):
    id: int
    user_id: int
    path_title: str
    target_role: str
    description: Optional[str] = None
    switch_probability: float
    steps_json: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True

class CareerRecommendRequest(BaseModel):
    target_role: Optional[str] = None

class SalaryPredictionRequest(BaseModel):
    job_title: str
    industry: Optional[str] = None
    location: Optional[str] = None
    experience_years: float

class SalaryPredictionResponse(BaseModel):
    id: int
    user_id: int
    job_title: str
    predicted_salary: float
    industry: Optional[str] = None
    location: Optional[str] = None
    experience_years: float
    confidence_interval: List[float]
    created_at: datetime

    class Config:
        from_attributes = True

class SkillGapResponse(BaseModel):
    target_job: str
    match_percentage: float
    matching_skills: List[str]
    missing_skills: List[str]
    learning_roadmap: List[Dict[str, Any]]

class JobResponse(BaseModel):
    id: int
    title: str
    company: str
    description: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    experience_required: float
    skills_required: List[str] = []
    source: str
    url: Optional[str] = None
    match_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CourseResponse(BaseModel):
    id: int
    title: str
    provider: Optional[str] = None
    description: Optional[str] = None
    skills_taught: List[str] = []
    url: Optional[str] = None
    rating: float
    platform: str

    class Config:
        from_attributes = True

class LearningProgressUpdate(BaseModel):
    status: str # not_started, in_progress, completed
    progress_percentage: float

class LearningProgressResponse(BaseModel):
    id: int
    user_id: int
    course_id: Optional[int] = None
    job_id: Optional[int] = None
    status: str
    progress_percentage: float
    updated_at: datetime
    course: Optional[CourseResponse] = None
    job: Optional[JobResponse] = None

    class Config:
        from_attributes = True

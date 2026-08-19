from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime

class UserCreate(BaseModel):
    name: Optional[str] = ""
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: Optional[str]
    email: EmailStr
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    education: Optional[List[Any]] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[Any]] = None
    projects: Optional[List[Any]] = None
    certifications: Optional[List[Any]] = None
    career_interests: Optional[List[Any]] = None
    profile_picture: Optional[str] = None
    professional_summary: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    education: List[Any] = []
    skills: List[str] = []
    experience: List[Any] = []
    projects: List[Any] = []
    certifications: List[Any] = []
    career_interests: List[Any] = []
    profile_picture: Optional[str] = None
    professional_summary: Optional[str] = None
    updated_at: datetime
    completion_percentage: Optional[int] = 0
    missing_mandatory_fields: List[str] = []
    mandatory_completed: bool = False
    
    class Config:
        from_attributes = True

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    file_path: str
    file_size: Optional[int] = 0
    version: Optional[int] = 1
    is_active: Optional[int] = 1
    uploaded_at: datetime
    
    class Config:
        from_attributes = True

class ResumeHistoryResponse(BaseModel):
    id: int
    user_id: int
    version: int
    original_filename: Optional[str] = None
    stored_filename: Optional[str] = None
    file_name: Optional[str] = None
    file_path: str
    action: str
    is_active: Optional[int] = 1
    parser_status: Optional[str] = "Parsed"
    resume_score: Optional[int] = 70
    summary: Optional[str] = None
    upload_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class SettingsUpdateRequest(BaseModel):
    theme: Optional[str] = "dark"
    email_notifications: Optional[bool] = True

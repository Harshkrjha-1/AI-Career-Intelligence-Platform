import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Career Intelligence Platform"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:Harsh@localhost:5432/career_platform",
        validation_alias="DATABASE_URL"
    )
    
    # JWT & Auth
    JWT_SECRET_KEY: str = Field(
        default="super-secret-key-change-in-production",
        validation_alias="JWT_SECRET_KEY"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # External APIs
    OPENAI_API_KEY: str = Field(default="", validation_alias="OPENAI_API_KEY")
    GEMINI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")
    EMAIL_PASSWORD: str = Field(default="", validation_alias="EMAIL_PASSWORD")
    EMAIL_FROM: str = "noreply@careerintel.com"
    
    # Redis & Celery
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        validation_alias="REDIS_URL"
    )

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

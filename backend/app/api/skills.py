from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Any

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.database import User, Profile
from app.schemas.schemas import SkillGapResponse
from app.services.career_ai import CareerAIService

router = APIRouter(prefix="/skills", tags=["Skill Gap Analysis"])

@router.get("/gap-analysis", response_model=SkillGapResponse)
def analyze_skill_gap(
    target_job: str = Query("Full Stack Engineer"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Perform deep analysis on profile skills gap relative to target roles.
    Generates step-by-step topics & durations in a detailed roadmap.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not configured.")
        
    user_skills = [sk.name for sk in profile.skills]
    
    # Run comparison analysis
    gap_result = CareerAIService.analyze_skill_gap(user_skills, target_job)
    return gap_result

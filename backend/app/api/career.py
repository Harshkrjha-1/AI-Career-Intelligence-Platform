from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.database import User, Profile, CareerPath, SalaryPrediction, Skill
from app.schemas.schemas import (
    CareerPathResponse, CareerRecommendRequest, SalaryPredictionRequest, SalaryPredictionResponse
)
from app.services.career_ai import CareerAIService
from app.services.salary_model import SalaryPredictionModel

router = APIRouter(tags=["Career & Salaries"])

@router.post("/career/recommend", response_model=List[CareerPathResponse])
def recommend_career_paths(
    req: CareerRecommendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Generate and recommend career paths based on user experience, roles, and current skills.
    Logs recommendations inside the career_paths table.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not configured. Please fill details first.")

    # Gather current title & skills
    current_title = req.target_role or profile.industry or "Software Engineer"
    user_skills = [sk.name for sk in profile.skills]
    if not user_skills:
        user_skills = ["Python", "HTML", "CSS"] # Default basic list

    # Query recommender
    recommendations = CareerAIService.recommend_career_paths(current_title, user_skills)
    
    # Save recommendations to database
    db_paths = []
    # Clear older paths to prevent duplicates
    db.query(CareerPath).filter(CareerPath.user_id == current_user.id).delete()
    
    for rec in recommendations:
        db_path = CareerPath(
            user_id=current_user.id,
            path_title=rec["path_title"],
            target_role=rec["target_role"],
            description=rec["description"],
            switch_probability=rec["switch_probability"],
            steps_json=rec["steps"]
        )
        db.add(db_path)
        db_paths.append(db_path)
        
    db.commit()
    for path in db_paths:
         db.refresh(path)
         
    return db_paths


@router.post("/salary/predict", response_model=SalaryPredictionResponse)
def predict_salary(
    req: SalaryPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Predict market salary rates based on role, location, industry, and skill lists.
    Saves predictions inside the salary_predictions table.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    user_skills = [s.name for s in profile.skills] if profile else []
    
    # Run mathematical regression mockup
    pred_res = SalaryPredictionModel.predict_salary(
        job_title=req.job_title,
        experience_years=req.experience_years,
        location=req.location or "Remote",
        industry=req.industry or "E-commerce",
        skills=user_skills
    )
    
    db_pred = SalaryPrediction(
        user_id=current_user.id,
        job_title=req.job_title,
        predicted_salary=pred_res["predicted_salary"],
        industry=req.industry,
        location=req.location,
        experience_years=req.experience_years,
        confidence_interval=pred_res["confidence_interval"]
    )
    
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)
    
    return db_pred

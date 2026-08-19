from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.database import User, Profile, Job
from app.schemas.schemas import JobResponse
from app.services.external_apis import ExternalAPIService

router = APIRouter(prefix="/jobs", tags=["Job Recommendations"])

# Helper to ensure DB has jobs seeded
def seed_jobs_if_empty(db: Session):
    count = db.query(Job).count()
    if count == 0:
        mock_jobs = ExternalAPIService.get_mock_linkedin_jobs()
        for j in mock_jobs:
            db.add(Job(
                title=j["title"],
                company=j["company"],
                description=j["description"],
                location=j["location"],
                salary_min=j["salary_min"],
                salary_max=j["salary_max"],
                experience_required=j["experience_required"],
                skills_required=j["skills_required"],
                source=j["source"],
                url=j["url"]
            ))
        db.commit()


@router.get("/recommend", response_model=List[JobResponse])
def recommend_jobs(
    location: Optional[str] = Query(None),
    salary_min: Optional[float] = Query(None),
    experience_max: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Match user skills against available jobs, scoring them based on common technologies.
    Supports filtering by location, minimum salary, and maximum experience required.
    """
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not configured.")

    # Seed some mock jobs if database is empty
    seed_jobs_if_empty(db)
    
    # Base query
    query = db.query(Job)
    
    # Filters
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if salary_min:
        query = query.filter(Job.salary_max >= salary_min)
    if experience_max is not None:
        query = query.filter(Job.experience_required <= experience_max)
        
    jobs = query.all()
    user_skills = [s.name.lower() for s in profile.skills]
    
    scored_jobs = []
    for job in jobs:
        job_skills = [s.lower() for s in job.skills_required] if job.skills_required else []
        
        # Calculate overlap match score
        if not job_skills:
            score = 50.0 # general baseline
        else:
            matching = [s for s in job_skills if s in user_skills]
            score = (len(matching) / len(job_skills)) * 100
            
        # Experience match weight adjustment
        exp_diff = abs(profile.experience_years - job.experience_required)
        # Deduct 5% per year of mismatch
        score = max(10.0, score - (exp_diff * 5.0))
        
        # Attach match score transiently
        job.match_score = round(score, 1)
        scored_jobs.append(job)
        
    # Sort by match score descending
    scored_jobs.sort(key=lambda x: x.match_score, reverse=True)
    return scored_jobs

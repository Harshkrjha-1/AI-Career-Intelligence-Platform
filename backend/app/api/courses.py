from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Any, List, Optional

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.database import User, Profile, Course, LearningProgress
from app.schemas.schemas import CourseResponse, LearningProgressResponse, LearningProgressUpdate
from app.services.external_apis import ExternalAPIService

router = APIRouter(tags=["Learning Recommendations"])

# Helper to seed course catalog if empty
def seed_courses_if_empty(db: Session):
    count = db.query(Course).count()
    if count == 0:
        mock_courses = ExternalAPIService.get_mock_courses()
        for c in mock_courses:
            db.add(Course(
                title=c["title"],
                provider=c["provider"],
                description=c["description"],
                skills_taught=c["skills_taught"],
                url=c["url"],
                rating=c["rating"],
                platform=c["platform"]
            ))
        db.commit()


@router.get("/courses/recommend", response_model=List[CourseResponse])
def recommend_courses(
    skill: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Recommend Coursera, Udemy, and YouTube courses matching user's missing skills or general search criteria.
    """
    seed_courses_if_empty(db)
    
    query = db.query(Course)
    if platform:
        query = query.filter(Course.platform == platform.lower())
        
    courses = query.all()
    
    if skill:
        # Filter by skill
        filtered = []
        for c in courses:
            skills_lower = [s.lower() for s in c.skills_taught]
            if skill.lower() in skills_lower or skill.lower() in c.title.lower():
                filtered.append(c)
        return filtered
        
    # If no specific skill queried, recommend based on user's gap analysis
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if profile:
        # Determine missing skills based on a default role (e.g. Full Stack)
        user_skills = [sk.name.lower() for sk in profile.skills]
        target_skills = ["python", "react", "typescript", "docker", "fastapi"] # base standard
        missing = [s for s in target_skills if s not in user_skills]
        
        if missing:
            filtered = []
            for c in courses:
                if any(s.lower() in [st.lower() for st in c.skills_taught] for s in missing):
                    filtered.append(c)
            if filtered:
                return filtered[:6]
                
    return courses[:6]


@router.get("/courses/progress", response_model=List[LearningProgressResponse])
def get_learning_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch learning and course tracking history of current user.
    """
    progress = db.query(LearningProgress).filter(LearningProgress.user_id == current_user.id).all()
    return progress


@router.post("/courses/{course_id}/progress", response_model=LearningProgressResponse)
def update_course_progress(
    course_id: int,
    req: LearningProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Log or update progress stats for a course (not_started, in_progress, completed).
    """
    # Verify course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found in system catalog.")
        
    progress = db.query(LearningProgress).filter(
        LearningProgress.user_id == current_user.id,
        LearningProgress.course_id == course_id
    ).first()
    
    if not progress:
        progress = LearningProgress(
            user_id=current_user.id,
            course_id=course_id,
            status=req.status,
            progress_percentage=req.progress_percentage
        )
        db.add(progress)
    else:
        progress.status = req.status
        progress.progress_percentage = req.progress_percentage
        
    db.commit()
    db.refresh(progress)
    return progress

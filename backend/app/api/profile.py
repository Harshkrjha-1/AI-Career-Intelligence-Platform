from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import Any
import os
import shutil

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.database import (
    User, Profile, Education, Experience, Project, Skill, Certification
)
from app.schemas.schemas import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["User Profile"])

# Helper to ensure profile exists
def get_or_create_profile(db: Session, user_id: int) -> Profile:
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        profile = Profile(
            user_id=user_id,
            experience_years=0.0,
            social_links={"linkedin": "", "github": "", "portfolio": ""}
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.get("", response_model=ProfileResponse)
def read_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve current user's profile with all relationships (skills, work history, education, projects, certifications).
    """
    profile = get_or_create_profile(db, current_user.id)
    return profile


@router.put("/update", response_model=ProfileResponse)
def update_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update profile details, education, experience, projects, skills, and certifications.
    """
    profile = get_or_create_profile(db, current_user.id)
    
    # Update simple fields
    update_data = profile_in.model_dump(exclude_unset=True)
    
    # Simple bio fields
    for field in ["full_name", "phone_number", "photo_url", "summary", "location", "industry", "experience_years", "current_salary", "target_salary", "social_links"]:
        if field in update_data and update_data[field] is not None:
            setattr(profile, field, update_data[field])

    # Update Education list if provided
    if profile_in.education is not None:
        # Simple clear-and-replace strategy for list items
        db.query(Education).filter(Education.profile_id == profile.id).delete()
        for edu in profile_in.education:
            db.add(Education(
                profile_id=profile.id,
                institution=edu.institution,
                degree=edu.degree,
                field_of_study=edu.field_of_study,
                start_date=edu.start_date,
                end_date=edu.end_date,
                description=edu.description
            ))

    # Update Experience list if provided
    if profile_in.experience is not None:
        db.query(Experience).filter(Experience.profile_id == profile.id).delete()
        for exp in profile_in.experience:
            db.add(Experience(
                profile_id=profile.id,
                company=exp.company,
                role=exp.role,
                location=exp.location,
                start_date=exp.start_date,
                end_date=exp.end_date,
                description=exp.description,
                is_current=exp.is_current
            ))

    # Update Projects list if provided
    if profile_in.projects is not None:
        db.query(Project).filter(Project.profile_id == profile.id).delete()
        for proj in profile_in.projects:
            db.add(Project(
                profile_id=profile.id,
                title=proj.title,
                description=proj.description,
                technologies=proj.technologies,
                link=proj.link
            ))

    # Update Skills list if provided
    if profile_in.skills is not None:
        db.query(Skill).filter(Skill.profile_id == profile.id).delete()
        for sk in profile_in.skills:
            db.add(Skill(
                profile_id=profile.id,
                name=sk.name,
                proficiency=sk.proficiency
            ))

    # Update Certifications list if provided
    if profile_in.certifications is not None:
        db.query(Certification).filter(Certification.profile_id == profile.id).delete()
        for cert in profile_in.certifications:
            db.add(Certification(
                profile_id=profile.id,
                name=cert.name,
                issuing_organization=cert.issuing_organization,
                issue_date=cert.issue_date,
                expiration_date=cert.expiration_date,
                credential_url=cert.credential_url
            ))

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/upload-photo")
def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Upload profile photo and update profile photo url.
    """
    profile = get_or_create_profile(db, current_user.id)
    
    # Local uploads directory
    upload_dir = "static/profile_photos"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"user_{current_user.id}{file_ext}"
    dest_path = os.path.join(upload_dir, safe_filename)
    
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Update URL (relative route served static)
        photo_url = f"/static/profile_photos/{safe_filename}"
        profile.photo_url = photo_url
        db.commit()
        
        return {"photo_url": photo_url, "message": "Photo uploaded successfully."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save profile photo: {e}"
        )

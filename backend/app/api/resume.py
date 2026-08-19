from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Any, List
import os
import shutil

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.database import User, Resume, ParsedResumeData
from app.schemas.schemas import ResumeResponse, ParsedResumeDataResponse, ResumeScoreResponse
from app.services.external_apis import ExternalAPIService
from app.tasks.celery_worker import parse_resume_task

router = APIRouter(prefix="/resume", tags=["Resume Upload & Parsing"])

UPLOAD_DIR = "static/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Upload resume file (PDF/DOCX), save to local storage, record version history, and trigger parser task.
    """
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF or DOCX file."
        )

    # Determine version history
    latest_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.version.desc()).first()
    new_version = (latest_resume.version + 1) if latest_resume else 1

    # Save file to disk
    safe_filename = f"user_{current_user.id}_v{new_version}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {e}"
        )

    # Create Resume record
    db_resume = Resume(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=dest_path,
        file_type=file_ext.replace(".", ""),
        version=new_version
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)

    # Trigger Celery background task for async processing
    try:
        parse_resume_task.delay(db_resume.id, db_resume.file_type, db_resume.file_name)
    except Exception as e:
        # Fallback: run it synchronously if Redis/Celery is down or unconfigured
        print(f"Celery task trigger failed: {e}. Executing parsing synchronously.")
        parse_resume_task(db_resume.id, db_resume.file_type, db_resume.file_name)

    return db_resume


@router.post("/parse", response_model=ParsedResumeDataResponse)
def trigger_synchronous_parse(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Triggers/completes synchronous parsing for immediate UI updates.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume file not found.")

    # Call Celery task synchronously
    parse_resume_task(resume.id, resume.file_type, resume.file_name)
    
    parsed_data = db.query(ParsedResumeData).filter(ParsedResumeData.resume_id == resume.id).first()
    if not parsed_data:
        raise HTTPException(status_code=500, detail="Parsing failed to generate database records.")
    return parsed_data


@router.get("/history", response_model=List[ResumeResponse])
def get_resume_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Fetch upload and version history of current user's resumes.
    """
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.version.desc()).all()
    return resumes


@router.get("/{resume_id}/parsed", response_model=ParsedResumeDataResponse)
def get_parsed_data(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve parsed content for a specific resume.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume file not found.")
    
    parsed_data = db.query(ParsedResumeData).filter(ParsedResumeData.resume_id == resume.id).first()
    if not parsed_data:
        raise HTTPException(status_code=404, detail="Parsed data not generated yet for this resume.")
    return parsed_data


@router.post("/evaluate", response_model=ResumeScoreResponse)
def evaluate_resume_quality(
    resume_id: int,
    target_role: str = "Software Engineer",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Evaluate resume using LLM for ATS match, Grammar rating, missing keyword and suggestion logs.
    """
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    parsed_data = db.query(ParsedResumeData).filter(ParsedResumeData.resume_id == resume.id).first()
    raw_text = parsed_data.raw_text if (parsed_data and parsed_data.raw_text) else "No text extracted from resume."
    
    # Run evaluation
    results = ExternalAPIService.evaluate_resume_score_with_llm(raw_text, target_role)
    return results

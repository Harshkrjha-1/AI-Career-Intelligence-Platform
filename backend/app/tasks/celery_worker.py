from celery import Celery
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.database import Resume, ParsedResumeData, Profile, Skill, Education, Experience, Project, Certification
from app.services.ai_parser import ResumeParser
import json

# Initialize Celery
celery_app = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="tasks.parse_resume_task")
def parse_resume_task(resume_id: int, file_type: str, file_name: str) -> bool:
    """
    Celery background task to parse an uploaded resume and update database models.
    """
    db = SessionLocal()
    try:
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        if not resume:
            print(f"Resume {resume_id} not found in DB.")
            return False

        # Read the file from the disk storage path
        try:
            with open(resume.file_path, "rb") as f:
                file_bytes = f.read()
        except Exception as e:
            print(f"Failed to read file from path {resume.file_path}: {e}")
            return False

        # Run the parser logic
        parsed = ResumeParser.parse_resume(file_bytes, file_type)
        
        # SaveParsedData to Database table 'parsed_resume_data'
        parsed_data = ParsedResumeData(
            resume_id=resume.id,
            raw_text=parsed["raw_text"],
            extracted_name=parsed["extracted_name"],
            extracted_email=parsed["extracted_email"],
            extracted_phone=parsed["extracted_phone"],
            extracted_skills=parsed["extracted_skills"],
            extracted_education=parsed["extracted_education"],
            extracted_experience=parsed["extracted_experience"],
            extracted_projects=parsed["extracted_projects"],
            extracted_certifications=parsed["extracted_certifications"]
        )
        
        # Check if parsed resume data already exists
        existing_parsed = db.query(ParsedResumeData).filter(ParsedResumeData.resume_id == resume.id).first()
        if existing_parsed:
            db.delete(existing_parsed)
        db.add(parsed_data)
        db.flush()

        # Update User Profile with extracted details if profile exists
        profile = db.query(Profile).filter(Profile.user_id == resume.user_id).first()
        if profile:
            if parsed["extracted_name"]:
                profile.full_name = parsed["extracted_name"]
            if parsed["extracted_phone"]:
                profile.phone_number = parsed["extracted_phone"]
            if parsed["raw_text"]:
                profile.summary = parsed["raw_text"][:500] + "..."
            
            # Map skills
            for sname in parsed["extracted_skills"]:
                # Check if skill exists on profile
                skill_exists = db.query(Skill).filter(Skill.profile_id == profile.id, Skill.name == sname).first()
                if not skill_exists:
                    db.add(Skill(profile_id=profile.id, name=sname, proficiency="intermediate"))
            
            # Map education
            for edu_item in parsed["extracted_education"]:
                db.add(Education(
                    profile_id=profile.id,
                    institution=edu_item["institution"],
                    degree=edu_item["degree"],
                    field_of_study=edu_item["field_of_study"],
                    start_date=edu_item["start_date"],
                    end_date=edu_item["end_date"],
                    description=edu_item["description"]
                ))
            
            # Map experience
            for exp_item in parsed["extracted_experience"]:
                db.add(Experience(
                    profile_id=profile.id,
                    company=exp_item["company"],
                    role=exp_item["role"],
                    location=exp_item["location"],
                    start_date=exp_item["start_date"],
                    end_date=exp_item["end_date"],
                    description=exp_item["description"],
                    is_current=exp_item["is_current"]
                ))

            # Map projects
            for proj_item in parsed["extracted_projects"]:
                db.add(Project(
                    profile_id=profile.id,
                    title=proj_item["title"],
                    description=proj_item["description"],
                    technologies=proj_item["technologies"],
                    link=proj_item["link"]
                ))

            # Map certifications
            for cert_item in parsed["extracted_certifications"]:
                db.add(Certification(
                    profile_id=profile.id,
                    name=cert_item["name"],
                    issuing_organization=cert_item["issuing_organization"],
                    issue_date=cert_item["issue_date"],
                    expiration_date=cert_item["expiration_date"],
                    credential_url=cert_item["credential_url"]
                ))

        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error executing parse_resume_task: {e}")
        return False
    finally:
        db.close()

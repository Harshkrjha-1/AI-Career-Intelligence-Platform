from typing import Dict, Any, List
import random

# Target skills maps for common roles
ROLE_SKILLS_MAP = {
    "Full Stack Engineer": ["Python", "React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "REST API", "AWS"],
    "Frontend Developer": ["React", "TypeScript", "HTML", "CSS", "Tailwind", "JavaScript", "Redux", "Vite"],
    "Backend Developer": ["Python", "FastAPI", "Django", "SQL", "PostgreSQL", "Redis", "Celery", "Docker", "AWS"],
    "Data Scientist": ["Python", "SQL", "Machine Learning", "Pandas", "NumPy", "Scikit-Learn", "TensorFlow", "NLP"],
    "AI/ML Engineer": ["Python", "PyTorch", "TensorFlow", "NLP", "Deep Learning", "Transformers", "spaCy", "Docker"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Git", "Linux", "Terraform", "Python"],
    "Product Manager": ["Product Management", "Agile", "Scrum", "System Design", "Project Management", "SQL"]
}

class CareerAIService:
    @staticmethod
    def analyze_skill_gap(user_skills: List[str], target_job: str) -> Dict[str, Any]:
        # Clean inputs
        user_skills_clean = [s.strip().lower() for s in user_skills]
        target_role = target_job.strip()
        
        # Match target role in map, or use default list
        target_skills = ROLE_SKILLS_MAP.get(target_role)
        if not target_skills:
            # Fallback target skills matching
            target_skills = ROLE_SKILLS_MAP["Full Stack Engineer"]
            
        matching_skills = []
        missing_skills = []
        
        for skill in target_skills:
            if skill.lower() in user_skills_clean:
                matching_skills.append(skill)
            else:
                missing_skills.append(skill)
                
        # Calculate percentage
        total_skills = len(target_skills)
        match_percentage = (len(matching_skills) / total_skills) * 100 if total_skills > 0 else 0
        
        # Generate learning roadmap steps
        learning_roadmap = []
        for index, skill in enumerate(missing_skills):
            learning_roadmap.append({
                "step": index + 1,
                "skill": skill,
                "duration": f"{random.randint(2, 4)} weeks",
                "difficulty": "Intermediate" if index % 2 == 0 else "Beginner",
                "topics": [f"Introduction to {skill}", f"Advanced {skill} concepts", "Practical Project implementation"],
                "status": "not_started"
            })
            
        return {
            "target_job": target_role,
            "match_percentage": round(match_percentage, 1),
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "learning_roadmap": learning_roadmap
        }

    @staticmethod
    def recommend_career_paths(current_title: str, user_skills: List[str]) -> List[Dict[str, Any]]:
        # Map current roles to potential next steps
        title_lower = current_title.lower() if current_title else ""
        
        recommendations = []
        
        # Determine recommendations based on current role
        if "front" in title_lower or "react" in title_lower:
            recommendations = [
                {
                    "path_title": "Frontend to Full Stack Transition",
                    "target_role": "Full Stack Engineer",
                    "description": "Expand your frontend React expertise into backend databases and servers. Learn Python, Node.js, and SQL to command the full web stack.",
                    "switch_probability": 0.85,
                    "steps": [
                        {"phase": "Phase 1: Backend Fundamentals", "description": "Master SQL databases and Python/FastAPI basics.", "duration": "4 weeks"},
                        {"phase": "Phase 2: System Architecture", "description": "Learn API routing, caching, and server deployment.", "duration": "4 weeks"},
                        {"phase": "Phase 3: Integration Project", "description": "Deploy a complete multi-container full-stack application.", "duration": "3 weeks"}
                    ]
                },
                {
                    "path_title": "Creative Development Path",
                    "target_role": "UI/UX Engineer",
                    "description": "Focus on aesthetic fidelity, design systems, and animations. Master Framer Motion, Tailwind CSS, and Figma interfaces.",
                    "switch_probability": 0.72,
                    "steps": [
                        {"phase": "Phase 1: Design Systems", "description": "Study typography, layout, grids, and design tokens.", "duration": "3 weeks"},
                        {"phase": "Phase 2: Micro-animations", "description": "Implement fluid physics-based transitions.", "duration": "2 weeks"}
                    ]
                }
            ]
        elif "back" in title_lower or "python" in title_lower or "django" in title_lower:
            recommendations = [
                {
                    "path_title": "Backend to AI Engineer Switch",
                    "target_role": "AI/ML Engineer",
                    "description": "Bridge the gap between model deployment and standard application APIs. Integrate PyTorch models, spaCy, and OpenAI embeddings.",
                    "switch_probability": 0.78,
                    "steps": [
                        {"phase": "Phase 1: Math & ML Basics", "description": "Brush up on linear algebra, statistics, and scikit-learn regression.", "duration": "5 weeks"},
                        {"phase": "Phase 2: NLP & Large Language Models", "description": "Learn semantic search, vector databases, and transformers.", "duration": "6 weeks"}
                    ]
                },
                {
                    "path_title": "Scalable Infrastructure Path",
                    "target_role": "DevOps Engineer",
                    "description": "Move from standard app architecture to infrastructure orchestration. Master Docker, Kubernetes, and CI/CD pipelines.",
                    "switch_probability": 0.80,
                    "steps": [
                        {"phase": "Phase 1: Containerization", "description": "Standardize local development using multi-stage Docker builds.", "duration": "3 weeks"},
                        {"phase": "Phase 2: Orchestration & Cloud", "description": "Deploy services to AWS ECS or EKS clusters.", "duration": "5 weeks"}
                    ]
                }
            ]
        else:
            # General fallback recommendations
            recommendations = [
                {
                    "path_title": "Engineering Lead Path",
                    "target_role": "Full Stack Engineer",
                    "description": "Master robust software design, database schemas, and modern frontend styling to lead full features from end to end.",
                    "switch_probability": 0.75,
                    "steps": [
                        {"phase": "Phase 1: Modern Frontend", "description": "Master React, TypeScript, and state managers.", "duration": "4 weeks"},
                        {"phase": "Phase 2: Scalable API Services", "description": "Build high-throughput async services using FastAPI and Redis.", "duration": "4 weeks"}
                    ]
                },
                {
                    "path_title": "Data-Driven Products Path",
                    "target_role": "Data Scientist",
                    "description": "Use Python and SQL to analyze profiles, build regression predictors, and surface metrics.",
                    "switch_probability": 0.65,
                    "steps": [
                        {"phase": "Phase 1: Data Foundations", "description": "Extract data using SQL and parse using Pandas.", "duration": "4 weeks"}
                    ]
                }
            ]
            
        return recommendations

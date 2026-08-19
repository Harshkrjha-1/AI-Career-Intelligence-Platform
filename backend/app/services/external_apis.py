import os
from typing import Dict, Any, List

openai = None
try:
    import openai
except ImportError:
    pass

genai = None
try:
    import google.generativeai as genai
except ImportError:
    pass

from app.core.config import settings

# Initialize API configurations if keys are present
if openai and settings.OPENAI_API_KEY:
    openai.api_key = settings.OPENAI_API_KEY

if genai and settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class ExternalAPIService:
    @classmethod
    def evaluate_resume_score_with_llm(cls, raw_text: str, target_role: str = "Software Engineer") -> Dict[str, Any]:
        """
        Evaluate resume text using OpenAI, Gemini, or a high-quality heuristic model.
        """
        prompt = (
            f"You are an expert recruiter. Analyze the following resume text for the role of '{target_role}'.\n"
            f"Provide a structured JSON output with the following keys:\n"
            f"- 'score': (integer between 0 and 100)\n"
            f"- 'ats_compatibility': (integer between 0 and 100)\n"
            f"- 'grammar_score': (integer between 0 and 100)\n"
            f"- 'bullet_points_score': (integer between 0 and 100)\n"
            f"- 'feedback': (list of strings highlighting positive/negative aspects)\n"
            f"- 'missing_keywords': (list of key technical skills/buzzwords typical for the role but missing)\n"
            f"- 'improvement_suggestions': (list of objects with keys 'section' and 'suggestion' explaining fixes)\n\n"
            f"Resume Text:\n{raw_text[:4000]}" # Limit size
        )

        # 1. Try Gemini API
        if genai and settings.GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel("gemini-pro")
                response = model.generate_content(prompt)
                import json
                # Try to parse response
                clean_txt = response.text.strip()
                # Clean markdown JSON block formatting if present
                if "```json" in clean_txt:
                    clean_txt = clean_txt.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_txt:
                    clean_txt = clean_txt.split("```")[1].split("```")[0].strip()
                data = json.loads(clean_txt)
                return data
            except Exception as e:
                print(f"Gemini API evaluation failed: {e}. Falling back to default.")

        # 2. Try OpenAI API
        if openai and settings.OPENAI_API_KEY:
            try:
                client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": "You are a professional resume writer and parser. Output JSON only."},
                        {"role": "user", "content": prompt}
                    ]
                )
                import json
                data = json.loads(response.choices[0].message.content)
                return data
            except Exception as e:
                print(f"OpenAI API evaluation failed: {e}. Falling back to default.")

        # 3. Fallback Heuristic Generator
        return cls.generate_heuristic_score(raw_text, target_role)

    @staticmethod
    def generate_heuristic_score(raw_text: str, target_role: str) -> Dict[str, Any]:
        """
        A high-quality, rule-based fallback analyzer.
        """
        feedback = []
        missing_keywords = []
        suggestions = []

        # Simple checks
        has_email = bool(re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", raw_text))
        has_phone = bool(re.search(r"\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}", raw_text))
        
        # Word count checks
        word_count = len(raw_text.split())
        
        score_deductions = 0
        ats_score = 85
        grammar_score = 90
        bullet_score = 80
        
        if not has_email:
            score_deductions += 15
            feedback.append("Missing email address on contact section.")
            suggestions.append({"section": "Contact Information", "suggestion": "Ensure your professional email is clearly visible at the top."})
        else:
            feedback.append("Contact details: Email successfully detected.")

        if not has_phone:
            score_deductions += 10
            feedback.append("Missing phone number.")
            suggestions.append({"section": "Contact Information", "suggestion": "Add a contact phone number with country code."})

        if word_count < 200:
            score_deductions += 20
            feedback.append("Resume content is extremely short (under 200 words).")
            suggestions.append({"section": "Content", "suggestion": "Expand on your key accomplishments, projects, and work metrics."})
        elif word_count > 1500:
            score_deductions += 10
            feedback.append("Resume is overly verbose (over 1500 words).")
            suggestions.append({"section": "Formatting", "suggestion": "Condense details to keep the resume length between 1 and 2 pages."})
        else:
            feedback.append("Resume length is within the optimal 1-2 pages limit.")

        # Look for section headers
        for section, keywords in {
            "Education": ["education", "university", "college", "degree"],
            "Experience": ["experience", "work history", "employment", "professional experience"],
            "Projects": ["projects", "personal projects", "portfolio"],
            "Skills": ["skills", "technical skills", "languages", "technologies"]
        }.items():
            if not any(kw in raw_text.lower() for kw in keywords):
                score_deductions += 10
                suggestions.append({"section": section, "suggestion": f"Create a dedicated '{section}' section to assist ATS parser search."})
                feedback.append(f"ATS warning: No clear '{section}' section header was detected.")

        # Keywords checking based on target role
        target_role_lower = target_role.lower()
        if "frontend" in target_role_lower or "react" in target_role_lower:
            req_keywords = ["React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind", "Git", "Redux"]
        elif "backend" in target_role_lower or "python" in target_role_lower:
            req_keywords = ["Python", "FastAPI", "SQL", "PostgreSQL", "Docker", "REST API", "Redis", "Celery"]
        elif "data" in target_role_lower or "machine" in target_role_lower or "ai" in target_role_lower:
            req_keywords = ["Python", "Machine Learning", "SQL", "Pandas", "PyTorch", "TensorFlow", "Scikit-Learn", "spaCy"]
        else:
            req_keywords = ["SQL", "Agile", "Docker", "Git", "API", "System Design", "Python", "Linux"]

        for kw in req_keywords:
            if kw.lower() not in raw_text.lower():
                missing_keywords.append(kw)
                
        if missing_keywords:
            score_deductions += len(missing_keywords) * 2
            suggestions.append({
                "section": "Keywords & Skills", 
                "suggestion": f"Integrate missing key technologies like {', '.join(missing_keywords[:4])} directly inside your descriptions."
            })

        final_score = max(35, 100 - score_deductions)
        
        return {
            "score": final_score,
            "ats_compatibility": max(40, ats_score - len(missing_keywords)*3),
            "grammar_score": grammar_score,
            "bullet_points_score": bullet_score,
            "feedback": feedback,
            "missing_keywords": missing_keywords,
            "improvement_suggestions": suggestions
        }

    @staticmethod
    def get_mock_linkedin_jobs(title: str = "", location: str = "") -> List[Dict[str, Any]]:
        # High-fidelity mockup data for LinkedIn Jobs search
        mock_jobs = [
            {
                "title": "Software Engineer (Full Stack)",
                "company": "Vercel",
                "description": "Build high-performance web systems. Help deploy modern serverless UI structures.",
                "location": "Remote",
                "salary_min": 110000,
                "salary_max": 140000,
                "experience_required": 2.0,
                "skills_required": ["TypeScript", "React", "Node.js", "Docker", "REST API"],
                "source": "LinkedIn",
                "url": "https://linkedin.com/jobs/view/vercel-full-stack"
            },
            {
                "title": "FastAPI Backend Developer",
                "company": "Hugging Face",
                "description": "Maintain model serving containers and backend inference pipelines using FastAPI and Celery.",
                "location": "Remote",
                "salary_min": 120000,
                "salary_max": 155000,
                "experience_required": 3.0,
                "skills_required": ["Python", "FastAPI", "Docker", "PyTorch", "Redis", "Celery"],
                "source": "LinkedIn",
                "url": "https://linkedin.com/jobs/view/hugging-face-backend"
            },
            {
                "title": "AI Platform Engineer",
                "company": "OpenAI",
                "description": "Design and scale modern AI APIs. Work on model evaluation, spaCy parsers, and custom safety hooks.",
                "location": "San Francisco",
                "salary_min": 150000,
                "salary_max": 200000,
                "experience_required": 4.0,
                "skills_required": ["Python", "OpenAI", "Kubernetes", "PyTorch", "Docker", "System Design"],
                "source": "LinkedIn",
                "url": "https://linkedin.com/jobs/view/openai-platform"
            },
            {
                "title": "Junior Frontend Engineer",
                "company": "Tailwind Labs",
                "description": "Collaborate on components, style frameworks, and visual styling tools with CSS and React.",
                "location": "Berlin",
                "salary_min": 65000,
                "salary_max": 80000,
                "experience_required": 1.0,
                "skills_required": ["React", "JavaScript", "HTML", "CSS", "Tailwind"],
                "source": "LinkedIn",
                "url": "https://linkedin.com/jobs/view/tailwind-frontend"
            },
            {
                "title": "DevOps Architect",
                "company": "HashiCorp",
                "description": "Lead multi-cloud container orchestration strategies using Terraform and Kubernetes.",
                "location": "London",
                "salary_min": 130000,
                "salary_max": 170000,
                "experience_required": 5.0,
                "skills_required": ["Docker", "Kubernetes", "AWS", "CI/CD", "Git"],
                "source": "LinkedIn",
                "url": "https://linkedin.com/jobs/view/hashicorp-devops"
            }
        ]
        
        # Simple query filter
        if title:
            filtered = [j for j in mock_jobs if title.lower() in j["title"].lower() or title.lower() in j["description"].lower() or title.lower() in "".join(j["skills_required"]).lower()]
            if filtered:
                return filtered
        return mock_jobs

    @staticmethod
    def get_mock_courses(skill_name: str = "") -> List[Dict[str, Any]]:
        # Mock Coursera/Udemy recommendation listings
        all_courses = [
            {"title": "FastAPI: The Complete Course", "provider": "Udemy", "description": "Build production-ready async web APIs using FastAPI, SQLite, and PostgreSQL.", "skills_taught": ["FastAPI", "Python", "SQL"], "url": "https://udemy.com/fastapi-course", "rating": 4.7, "platform": "udemy"},
            {"title": "React with TypeScript: Complete Guide", "provider": "Coursera", "description": "Master React Hooks, TypeScript interfaces, and Recharts graph integrations.", "skills_taught": ["React", "TypeScript", "JavaScript"], "url": "https://coursera.org/react-ts", "rating": 4.8, "platform": "coursera"},
            {"title": "Docker and Kubernetes: Masterclass", "provider": "Udemy", "description": "Containerize your software with Docker Compose, and build multi-node setups in Kubernetes.", "skills_taught": ["Docker", "Kubernetes", "CI/CD"], "url": "https://udemy.com/docker-kubernetes", "rating": 4.9, "platform": "udemy"},
            {"title": "Intro to spaCy & Natural Language Processing", "provider": "YouTube", "description": "Learn parsing, named entity recognition, and skill extractors using Python and spaCy.", "skills_taught": ["spaCy", "NLP", "Python"], "url": "https://youtube.com/spacy-nlp-tutorial", "rating": 4.6, "platform": "youtube"},
            {"title": "OpenAI & LangChain: Developer Roadmap", "provider": "Coursera", "description": "Integrate GPT-4, semantic vectors, and cognitive agents inside business workflows.", "skills_taught": ["OpenAI", "Python", "Machine Learning"], "url": "https://coursera.org/openai-langchain", "rating": 4.8, "platform": "coursera"},
            {"title": "Tailwind CSS from Scratch", "provider": "Udemy", "description": "Create stunning, high-fidelity responsive websites using modern Tailwind utility utility-classes.", "skills_taught": ["Tailwind", "CSS", "HTML"], "url": "https://udemy.com/tailwind-css", "rating": 4.7, "platform": "udemy"}
        ]
        
        if skill_name:
            filtered = [c for c in all_courses if skill_name.lower() in [s.lower() for s in c["skills_taught"]] or skill_name.lower() in c["title"].lower()]
            if filtered:
                return filtered
        return all_courses
# For regex parsing in fallback
import re

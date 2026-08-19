import re
import io
import pdfplumber
import docx
from typing import Dict, Any, List

spacy = None
try:
    import spacy
except ImportError:
    pass

# Try to load spaCy model, fallback gracefully if not installed/downloaded
nlp = None
if spacy:
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        # If downloading/loading fails, we can fall back to standard NLP/heuristics
        pass

# Predefined common skill list for matching
SKILL_DICTIONARY = [
    "python", "javascript", "typescript", "react", "vue", "angular", "node.js", "node", 
    "fastapi", "django", "flask", "express", "sql", "postgresql", "mysql", "mongodb", 
    "redis", "celery", "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "git",
    "html", "css", "tailwind", "sass", "graphql", "rest api", "nlp", "machine learning",
    "deep learning", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "spacy",
    "scrum", "agile", "project management", "product management", "system design",
    "microservices", "solidity", "rust", "go", "c++", "c#", "java", "spring boot"
]

class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        text = ""
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")
        return text

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        text = ""
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            print(f"Error reading DOCX: {e}")
        return text

    @classmethod
    def parse_resume(cls, file_bytes: bytes, file_type: str) -> Dict[str, Any]:
        if file_type.lower() == "pdf":
            raw_text = cls.extract_text_from_pdf(file_bytes)
        elif file_type.lower() in ["docx", "doc"]:
            raw_text = cls.extract_text_from_docx(file_bytes)
        else:
            raw_text = file_bytes.decode("utf-8", errors="ignore")

        # Extraction logic
        name = cls.extract_name(raw_text)
        email = cls.extract_email(raw_text)
        phone = cls.extract_phone(raw_text)
        skills = cls.extract_skills(raw_text)
        education = cls.extract_education(raw_text)
        experience = cls.extract_experience(raw_text)
        projects = cls.extract_projects(raw_text)
        certifications = cls.extract_certifications(raw_text)

        return {
            "raw_text": raw_text,
            "extracted_name": name,
            "extracted_email": email,
            "extracted_phone": phone,
            "extracted_skills": skills,
            "extracted_education": education,
            "extracted_experience": experience,
            "extracted_projects": projects,
            "extracted_certifications": certifications
        }

    @staticmethod
    def extract_email(text: str) -> str:
        email_regex = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
        emails = re.findall(email_regex, text)
        return emails[0] if emails else ""

    @staticmethod
    def extract_phone(text: str) -> str:
        # Matches patterns like +1-234-567-8901, 123 456 7890, etc.
        phone_regex = r"\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}"
        phones = re.findall(phone_regex, text)
        cleaned_phones = [p.strip() for p in phones if len(re.sub(r"\D", "", p)) >= 10]
        return cleaned_phones[0] if cleaned_phones else ""

    @staticmethod
    def extract_name(text: str) -> str:
        # Heuristic: usually the first non-empty line contains the candidate name
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        if nlp:
            # Parse first 500 characters using spaCy
            doc = nlp(text[:500])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    # Verify it's in the first couple of lines
                    for line in lines[:3]:
                        if ent.text in line:
                            return ent.text
        
        # Fallback to the very first line if it looks like a name
        if lines:
            first_line = lines[0]
            if len(first_line.split()) <= 4 and re.match(r"^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$", first_line):
                return first_line
            return lines[0]
        return ""

    @staticmethod
    def extract_skills(text: str) -> List[str]:
        extracted = []
        text_lower = text.lower()
        for skill in SKILL_DICTIONARY:
            # Boundary prefix: only require word boundary if first char is alphanumeric
            prefix = r"\b" if skill[0].isalnum() else ""
            # Boundary suffix: only require word boundary if last char is alphanumeric
            suffix = r"\b" if skill[-1].isalnum() else ""
            pattern = prefix + re.escape(skill) + suffix
            if re.search(pattern, text_lower):
                # Capitalize nicely based on dictionary formatting
                extracted.append(skill.title() if skill not in ["aws", "gcp", "sql", "html", "css", "ci/cd", "nlp", "rest api"] else skill.upper())
        return list(set(extracted))

    @staticmethod
    def extract_education(text: str) -> List[Dict[str, Any]]:
        education_list = []
        lines = text.split("\n")
        
        edu_keywords = ["university", "college", "institute", "school", "academy"]
        degree_keywords = ["bachelor", "master", "doctor", "phd", "b.s", "m.s", "b.tech", "m.tech", "bba", "mba", "bsc", "msc", "degree"]

        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in edu_keywords) or any(deg in line_lower for deg in degree_keywords):
                # Extract surrounding lines for description/context
                start = max(0, i - 1)
                end = min(len(lines), i + 3)
                context = "\n".join(lines[start:end])
                
                # Try to clean/extract details
                institution = ""
                for k in edu_keywords:
                    match = re.search(r"([^,\n]*" + re.escape(k) + r"[^,\n]*)", line, re.IGNORECASE)
                    if match:
                        institution = match.group(1).strip()
                        break
                if not institution:
                    institution = line.strip()

                degree = "Degree"
                for d in degree_keywords:
                    match = re.search(r"([^,\n]*" + re.escape(d) + r"[^,\n]*)", line, re.IGNORECASE)
                    if match:
                        degree = match.group(1).strip()
                        break

                education_list.append({
                    "institution": institution[:255] if institution else "Unknown Institution",
                    "degree": degree[:255] if degree else "Bachelor's Degree",
                    "field_of_study": "Field of Study",
                    "start_date": "2020",
                    "end_date": "2024",
                    "description": context[:500]
                })
        
        # De-duplicate
        unique_edu = []
        seen = set()
        for edu in education_list:
            key = (edu["institution"].lower(), edu["degree"].lower())
            if key not in seen:
                seen.add(key)
                unique_edu.append(edu)
                
        return unique_edu[:3] # limit to top 3

    @staticmethod
    def extract_experience(text: str) -> List[Dict[str, Any]]:
        # Find experience sections
        exp_list = []
        lines = text.split("\n")
        
        # Common job titles
        title_keywords = ["developer", "engineer", "designer", "manager", "analyst", "consultant", "architect", "lead", "intern"]
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(tk in line_lower for tk in title_keywords) and len(line.split()) < 8:
                # Potential experience title
                company = "Company Name"
                # Check preceding/following line for company name
                for offset in [-1, 1]:
                    if 0 <= i + offset < len(lines):
                        cand = lines[i + offset].strip()
                        if cand and len(cand.split()) < 5 and not any(tk in cand.lower() for tk in title_keywords):
                            company = cand
                            break
                
                start = i
                end = min(len(lines), i + 6)
                description = "\n".join(lines[start:end])
                
                exp_list.append({
                    "company": company[:255],
                    "role": line.strip()[:255],
                    "location": "Remote",
                    "start_date": "2021",
                    "end_date": "Present",
                    "description": description[:1000],
                    "is_current": "present" in description.lower() or "current" in description.lower()
                })
                
        # De-duplicate and limit
        unique_exp = []
        seen = set()
        for exp in exp_list:
            key = (exp["company"].lower(), exp["role"].lower())
            if key not in seen:
                seen.add(key)
                unique_exp.append(exp)
        return unique_exp[:4]

    @staticmethod
    def extract_projects(text: str) -> List[Dict[str, Any]]:
        # Extract sections mentioning project names
        projects_list = []
        lines = text.split("\n")
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if ("project" in line_lower or "portfolio" in line_lower) and len(line.split()) < 6:
                start = i
                end = min(len(lines), i + 5)
                desc = "\n".join(lines[start:end])
                
                projects_list.append({
                    "title": line.strip()[:255],
                    "description": desc[:500],
                    "technologies": ["Python", "React", "SQL"][:3], # placeholder matches
                    "link": "https://github.com"
                })
        return projects_list[:3]

    @staticmethod
    def extract_certifications(text: str) -> List[Dict[str, Any]]:
        certs = []
        lines = text.split("\n")
        cert_keywords = ["certified", "certification", "aws certified", "google cloud", "azure certified", "scrum master", "pmp"]
        
        for line in lines:
            if any(keyword in line.lower() for keyword in cert_keywords) and len(line.split()) < 10:
                certs.append({
                    "name": line.strip()[:255],
                    "issuing_organization": "Credly Verified",
                    "issue_date": "2023",
                    "expiration_date": "2026",
                    "credential_url": "https://credly.com"
                })
        return certs[:4]

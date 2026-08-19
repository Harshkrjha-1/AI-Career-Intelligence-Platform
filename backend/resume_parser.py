import re
import io
import pdfplumber

fitz = None
try:
    import fitz # PyMuPDF
except ImportError:
    pass

docx = None
try:
    import docx
except ImportError:
    pass

SKILL_LIST = [
    "python", "javascript", "typescript", "react", "vue", "angular", "node.js", "node", 
    "fastapi", "django", "flask", "express", "sql", "postgresql", "mysql", "mongodb", 
    "redis", "celery", "docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "git",
    "html", "css", "tailwind", "sass", "graphql", "rest api", "nlp", "machine learning",
    "deep learning", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "spacy",
    "scrum", "agile", "project management", "product management", "system design",
    "microservices", "solidity", "rust", "go", "c++", "c#", "java", "spring boot"
]

def extract_text(file_bytes: bytes, file_type: str) -> str:
    text = ""
    file_ext = file_type.lower().replace(".", "")
    if file_ext == "pdf":
        if fitz:
            try:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                for page in doc:
                    text += page.get_text() + "\n"
                doc.close()
            except Exception as e:
                print(f"fitz PDF parsing failed: {e}")
        if not text.strip():
            try:
                with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                print(f"pdfplumber PDF parsing failed: {e}")
    elif file_ext in ["docx", "doc"]:
        if docx:
            try:
                doc = docx.Document(io.BytesIO(file_bytes))
                for para in doc.paragraphs:
                    text += para.text + "\n"
            except Exception as e:
                print(f"docx Word parsing failed: {e}")
    else:
        try:
            text = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            pass
    return text

def extract_email(text: str) -> str:
    email_regex = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
    emails = re.findall(email_regex, text)
    return emails[0] if emails else ""

def extract_phone(text: str) -> str:
    phone_regex = r"\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}"
    phones = re.findall(phone_regex, text)
    cleaned = [p.strip() for p in phones if len(re.sub(r"\D", "", p)) >= 10]
    return cleaned[0] if cleaned else ""

def extract_skills(text: str) -> list:
    extracted = []
    text_lower = text.lower()
    for skill in SKILL_LIST:
        prefix = r"\b" if skill[0].isalnum() else ""
        suffix = r"\b" if skill[-1].isalnum() else ""
        pattern = prefix + re.escape(skill) + suffix
        if re.search(pattern, text_lower):
            extracted.append(skill.title() if skill not in ["aws", "gcp", "sql", "html", "css", "ci/cd", "nlp", "rest api"] else skill.upper())
    return list(set(extracted))

def extract_education(text: str) -> list:
    education_list = []
    lines = text.split("\n")
    edu_keywords = ["university", "college", "institute", "school", "academy"]
    degree_keywords = ["bachelor", "master", "doctor", "phd", "b.s", "m.s", "b.tech", "m.tech", "degree"]

    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in edu_keywords) or any(deg in line_lower for deg in degree_keywords):
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
                "college": institution[:255] if institution else "Unknown Institution",
                "degree": degree[:255] if degree else "Degree",
                "year": "2024"
            })
    
    unique_edu = []
    seen = set()
    for edu in education_list:
        key = (edu["college"].lower(), edu["degree"].lower())
        if key not in seen:
            seen.add(key)
            unique_edu.append(edu)
    return unique_edu[:3]

def extract_experience(text: str) -> list:
    exp_list = []
    lines = text.split("\n")
    title_keywords = ["developer", "engineer", "designer", "manager", "analyst", "consultant", "architect", "lead", "intern"]
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(tk in line_lower for tk in title_keywords) and len(line.split()) < 8:
            company = "Company"
            for offset in [-1, 1]:
                if 0 <= i + offset < len(lines):
                    cand = lines[i + offset].strip()
                    if cand and len(cand.split()) < 5 and not any(tk in cand.lower() for tk in title_keywords):
                        company = cand
                        break
            start = i
            end = min(len(lines), i + 5)
            description = "\n".join(lines[start:end])
            exp_list.append({
                "title": line.strip()[:255],
                "company": company[:255],
                "description": description[:500]
            })
            
    unique_exp = []
    seen = set()
    for exp in exp_list:
        key = (exp["company"].lower(), exp["title"].lower())
        if key not in seen:
            seen.add(key)
            unique_exp.append(exp)
    return unique_exp[:4]

def extract_projects(text: str) -> list:
    proj_list = []
    lines = text.split("\n")
    proj_keywords = ["project", "developed", "built", "implemented", "created", "designed", "system", "app", "application", "platform"]
    for i, line in enumerate(lines):
        line_lower = line.lower()
        if any(pk in line_lower for pk in proj_keywords) and len(line.split()) < 10:
            proj_list.append({
                "title": line.strip()[:255],
                "description": "\n".join(lines[i:min(len(lines), i+3)])[:500]
            })
    return proj_list[:4]

def extract_certifications(text: str) -> list:
    cert_list = []
    lines = text.split("\n")
    cert_keywords = ["certified", "certification", "certificate", "aws", "google", "microsoft", "coursera", "udemy"]
    for line in lines:
        line_lower = line.lower()
        if any(ck in line_lower for ck in cert_keywords) and len(line.split()) < 12:
            cert_list.append(line.strip()[:255])
    return list(set(cert_list))[:5]

def parse_resume(file_bytes: bytes, file_type: str) -> dict:
    text = extract_text(file_bytes, file_type)
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    name = lines[0] if lines else ""
    for line in lines[:3]:
        if len(line.split()) <= 4 and re.match(r"^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$", line):
            name = line
            break
            
    return {
        "name": name,
        "email": extract_email(text),
        "phone": extract_phone(text),
        "education": extract_education(text),
        "skills": extract_skills(text),
        "experience": extract_experience(text),
        "projects": extract_projects(text),
        "certifications": extract_certifications(text)
    }

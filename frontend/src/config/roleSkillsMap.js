export const ROLE_SKILLS_MAP = {
  "AI Engineer": ["Python", "TensorFlow", "PyTorch", "SQL", "MLOps", "System Design", "Docker", "REST APIs", "PostgreSQL", "Git"],
  "Machine Learning Engineer": ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Pandas", "SQL", "Docker", "Git", "System Design", "AWS"],
  "Full Stack Developer": ["React", "Node.js", "JavaScript", "TypeScript", "PostgreSQL", "MongoDB", "REST APIs", "Docker", "Git", "HTML"],
  "Backend Developer": ["Node.js", "Python", "PostgreSQL", "MongoDB", "REST APIs", "Docker", "Git", "Redis", "AWS", "System Design"],
  "Frontend Developer": ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Tailwind", "REST APIs", "Git", "Redux", "Next.js"],
  "Software Engineer": ["Python", "Java", "C++", "SQL", "Git", "System Design", "REST APIs", "PostgreSQL", "Docker", "Data Structures"],
  "Data Scientist": ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Machine Learning", "Statistics", "Data Visualization", "Tableau"],
  "Data Engineer": ["Python", "SQL", "PostgreSQL", "Docker", "AWS", "Spark", "Airflow", "ETL", "Git", "System Design"],
  "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Git", "Python", "Terraform", "System Design", "Bash"],
  "Cloud Engineer": ["AWS", "Docker", "Kubernetes", "Linux", "Python", "CI/CD", "Terraform", "Networking", "Git", "GCP"]
};

export const getSkillsForRole = (roleName) => {
  if (!roleName || roleName === "Not Available") {
    return ROLE_SKILLS_MAP["AI Engineer"];
  }

  const lowerRole = roleName.toLowerCase();
  for (const [key, skills] of Object.entries(ROLE_SKILLS_MAP)) {
    if (lowerRole.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerRole)) {
      return skills;
    }
  }
  return ROLE_SKILLS_MAP["Software Engineer"];
};

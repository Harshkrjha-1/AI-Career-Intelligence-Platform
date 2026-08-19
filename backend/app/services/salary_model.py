from typing import Dict, Any, List

# Core configuration for salary predictions
BASE_SALARIES = {
    "Full Stack Engineer": 85000,
    "Frontend Developer": 75000,
    "Backend Developer": 80000,
    "Data Scientist": 95000,
    "AI/ML Engineer": 110000,
    "DevOps Engineer": 90000,
    "Product Manager": 95000,
    "Software Engineer": 80000
}

LOCATION_MULTIPLIERS = {
    "San Francisco": 1.35,
    "New York": 1.30,
    "Seattle": 1.25,
    "London": 1.15,
    "Remote": 1.00,
    "Bangalore": 0.55,
    "Berlin": 0.95,
    "Toronto": 1.05
}

INDUSTRY_MULTIPLIERS = {
    "Fintech": 1.15,
    "Healthcare": 1.05,
    "E-commerce": 1.00,
    "Edtech": 0.90,
    "Web3 / Blockchain": 1.20,
    "Cybersecurity": 1.10,
    "AI / Deep Tech": 1.25
}

SKILL_BONUSES = {
    "Kubernetes": 5000,
    "Docker": 2000,
    "PyTorch": 6000,
    "TensorFlow": 4000,
    "React": 1500,
    "FastAPI": 2000,
    "TypeScript": 1500,
    "System Design": 4000,
    "AWS": 3000,
    "OpenAI": 5000,
    "spaCy": 2500
}

class SalaryPredictionModel:
    @staticmethod
    def predict_salary(
        job_title: str,
        experience_years: float,
        location: str = "Remote",
        industry: str = "E-commerce",
        skills: List[str] = []
    ) -> Dict[str, Any]:
        # Clean inputs
        role = job_title.strip()
        loc = location.strip() if location else "Remote"
        ind = industry.strip() if industry else "E-commerce"
        
        # Match closest base salary
        base = BASE_SALARIES.get(role, 80000)
        for key, val in BASE_SALARIES.items():
            if key.lower() in role.lower():
                base = val
                break
                
        # Calculate experience factor (non-linear: higher returns early, levels off)
        # Formula: Base increases by 8% per year up to 5 years, then 4% up to 10 years, then 2%
        exp_factor = 1.0
        if experience_years > 0:
            if experience_years <= 5:
                exp_factor += (experience_years * 0.08)
            elif experience_years <= 10:
                exp_factor += (5 * 0.08) + ((experience_years - 5) * 0.04)
            else:
                exp_factor += (5 * 0.08) + (5 * 0.04) + ((experience_years - 10) * 0.02)
                
        # Location modifier
        loc_mult = LOCATION_MULTIPLIERS.get(loc, 1.00)
        for key, val in LOCATION_MULTIPLIERS.items():
            if key.lower() in loc.lower():
                loc_mult = val
                break
                
        # Industry modifier
        ind_mult = INDUSTRY_MULTIPLIERS.get(ind, 1.00)
        for key, val in INDUSTRY_MULTIPLIERS.items():
            if key.lower() in ind.lower():
                ind_mult = val
                break
                
        # Skill premiums
        skill_bonus = 0
        user_skills_lower = [s.lower() for s in skills]
        for skill_name, bonus_val in SKILL_BONUSES.items():
            if skill_name.lower() in user_skills_lower:
                skill_bonus += bonus_val
                
        # Prediction formula
        predicted = (base * exp_factor * loc_mult * ind_mult) + skill_bonus
        predicted = round(predicted, -2) # round to nearest hundred
        
        # Confidence interval (e.g. +/- 10% range)
        margin = predicted * 0.10
        min_salary = round(predicted - margin, -2)
        max_salary = round(predicted + margin, -2)
        
        return {
            "predicted_salary": predicted,
            "confidence_interval": [min_salary, max_salary]
        }

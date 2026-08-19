from fastapi.testclient import TestClient

def test_salary_prediction(client: TestClient):
    # Register user first
    client.post("/api/auth/register", json={
        "email": "testcandidate@careerintel.com",
        "password": "securepassword123"
    })

    # 1. Login user to get credentials
    login_response = client.post("/api/auth/login", json={
        "email": "testcandidate@careerintel.com",
        "password": "securepassword123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Predict salary
    payload = {
        "job_title": "AI/ML Engineer",
        "industry": "AI / Deep Tech",
        "location": "San Francisco",
        "experience_years": 4.0
    }
    response = client.post("/api/salary/predict", json=payload, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["job_title"] == payload["job_title"]
    assert data["predicted_salary"] > 0
    assert len(data["confidence_interval"]) == 2
    assert data["confidence_interval"][0] < data["predicted_salary"] < data["confidence_interval"][1]

def test_skill_gap_analysis(client: TestClient):
    # Register user first (will return 400 if already exists, which is fine, or we use unique email)
    client.post("/api/auth/register", json={
        "email": "testcandidate2@careerintel.com",
        "password": "securepassword123"
    })

    # 1. Login user
    login_response = client.post("/api/auth/login", json={
        "email": "testcandidate2@careerintel.com",
        "password": "securepassword123"
    })
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Run gap analysis on Full Stack
    response = client.get("/api/skills/gap-analysis", params={"target_job": "Full Stack Engineer"}, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["target_job"] == "Full Stack Engineer"
    assert "match_percentage" in data
    assert "missing_skills" in data
    assert len(data["learning_roadmap"]) >= 0

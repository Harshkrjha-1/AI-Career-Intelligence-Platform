from fastapi.testclient import TestClient

def test_register_user(client: TestClient):
    payload = {
        "email": "testcandidate@careerintel.com",
        "password": "securepassword123"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert "id" in data
    assert data["is_active"] is True

def test_register_duplicate_user(client: TestClient):
    payload = {
        "email": "testcandidate@careerintel.com",
        "password": "anotherpassword123"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "exists" in response.json()["detail"]

def test_login_user(client: TestClient):
    payload = {
        "email": "testcandidate@careerintel.com",
        "password": "securepassword123"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_credentials(client: TestClient):
    payload = {
        "email": "testcandidate@careerintel.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert "Incorrect" in response.json()["detail"]

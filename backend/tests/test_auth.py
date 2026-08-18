def test_signup_first_user_is_admin(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "Admin User", "email": "admin@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "admin"


def test_signup_second_user_is_member(client, admin):
    resp = client.post(
        "/auth/signup",
        json={"name": "Member User", "email": "member@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "member"


def test_signup_duplicate_email_rejected(client, admin):
    resp = client.post(
        "/auth/signup",
        json={"name": "Copycat", "email": "admin@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 400


def test_signup_short_password_rejected(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "Someone", "email": "someone@example.com", "password": "short"},
    )
    assert resp.status_code == 422


def test_signup_empty_name_rejected(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "   ", "email": "someone@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 422


def test_login_success(client, admin):
    resp = client.post(
        "/auth/login", json={"email": "admin@example.com", "password": "testpass123"}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client, admin):
    resp = client.post(
        "/auth/login", json={"email": "admin@example.com", "password": "wrongpass"}
    )
    assert resp.status_code == 401


def test_login_nonexistent_email(client):
    resp = client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "testpass123"}
    )
    assert resp.status_code == 401


def test_me_requires_auth(client):
    resp = client.get("/auth/me")
    assert resp.status_code in (401, 403)


def test_me_returns_current_user(client, admin):
    resp = client.get("/auth/me", headers=admin["headers"])
    assert resp.status_code == 200
    assert resp.json()["email"] == "admin@example.com"

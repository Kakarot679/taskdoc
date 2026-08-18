import os

os.environ.setdefault("SECRET_KEY", "pytest-test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "60")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.db import Base, get_db
from app.main import app

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

ADMIN_EMAIL = "admin@example.com"
MEMBER_EMAIL = "member@example.com"
PASSWORD = "testpass123"


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _signup_and_login(client, name, email, password=PASSWORD):
    client.post("/auth/signup", json={"name": name, "email": email, "password": password})
    login = client.post("/auth/login", json={"email": email, "password": password})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    user = client.get("/auth/me", headers=headers).json()
    return {"token": token, "headers": headers, "user": user}


@pytest.fixture()
def admin(client):
    """First registered user - becomes admin."""
    return _signup_and_login(client, "Admin User", ADMIN_EMAIL)


@pytest.fixture()
def member(client, admin):
    """Second registered user - becomes member. Depends on `admin` so signup order is guaranteed."""
    return _signup_and_login(client, "Member User", MEMBER_EMAIL)

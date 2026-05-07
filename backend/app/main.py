from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from sqlalchemy.exc import OperationalError
from app.database.db import Base, engine
from app.models import user, project, task  # ensure models are registered
from app.routers import auth, projects, tasks, dashboard, users

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app = FastAPI(title="Taskdoc API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.on_event("startup")
def create_tables():
    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        raise RuntimeError(
            "Database connection failed. Start MySQL and check backend/.env "
            "DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME."
        ) from exc


@app.get("/")
def root():
    return {"message": "Taskdoc API is running"}

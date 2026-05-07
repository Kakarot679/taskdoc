# Taskdoc

Taskdoc is a team task management app built around the kind of workflow a small team might actually use: projects, members, assigned tasks, due dates, status updates, and a dashboard for keeping an eye on progress.

I built it as a full-stack portfolio project using FastAPI, React, and MySQL. The goal was not to make a huge project management suite, but to build a clean and practical SaaS-style app with authentication, role-based access, useful APIs, and a responsive interface.

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router DOM, Axios  
**Backend:** FastAPI, SQLAlchemy, Pydantic, python-jose, Passlib/Bcrypt  
**Database:** MySQL  
**Deployment:** Railway

---

## What It Does

- Users can sign up, log in, and stay authenticated with JWT tokens.
- Admins can create projects, add team members, assign tasks, and manage project work.
- Members can view their assigned work and update task progress.
- Tasks support status, priority, due dates, and overdue tracking.
- The dashboard shows useful task stats and upcoming deadlines.
- The task workspace includes filters for easier day-to-day use.
- Users can update basic profile details.
- The layout works across desktop, tablet, and mobile screens.

---

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend` with your MySQL credentials, then run:

```bash
uvicorn app.main:app --reload
```

The API runs at:

```text
http://localhost:8000
```

FastAPI docs are available at:

```text
http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

If your backend is running somewhere else, add this to `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

---

## Environment Variables

### Backend `.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=taskdoc_db
SECRET_KEY=some_long_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000
```

---

## Database

Create the MySQL database before starting the backend:

```sql
CREATE DATABASE taskdoc_db;
```

The tables are created automatically when the backend starts through SQLAlchemy's `create_all`.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Log in and receive a JWT token |
| GET | `/auth/me` | Get the logged-in user's details |
| GET | `/projects` | List projects the user can access |
| POST | `/projects` | Create a project |
| GET | `/projects/{id}` | Get project details |
| DELETE | `/projects/{id}` | Delete a project |
| GET | `/projects/{id}/members` | List project members |
| POST | `/projects/{id}/members` | Add a project member |
| DELETE | `/projects/{id}/members/{uid}` | Remove a project member |
| GET | `/tasks?project_id=` | List tasks |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/{id}` | Update a task |
| DELETE | `/tasks/{id}` | Delete a task |
| GET | `/dashboard/stats` | Get dashboard stats |
| GET | `/users` | List users |
| PUT | `/users/me` | Update profile details |

Some endpoints are role-protected. For example, project creation, member management, task assignment, and deletes are admin-only actions.

---

## Deployment Notes

The project is set up to deploy on Railway as a small monorepo:

1. MySQL database service
2. Backend service with `/backend` as the root directory
3. Frontend service with `/frontend` as the root directory

Backend start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Backend variables:

```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=https://your-frontend-domain.up.railway.app
```

Frontend variables:

```env
VITE_API_URL=https://your-backend-domain.up.railway.app
```

After Railway gives public URLs to both services, update `ALLOWED_ORIGINS` with the actual frontend URL and redeploy the backend.

---

## Possible Improvements

- Email notifications for task assignments
- Task comments
- File attachments
- Activity history for projects
- Pagination for larger task lists
- Dark mode

---

## Project Scope

Taskdoc is intentionally kept at a realistic portfolio-project size. It focuses on the core pieces that matter in a team workflow: auth, roles, projects, tasks, validation, and a usable dashboard. I avoided heavier patterns like Redux, microservices, drag-and-drop boards, or real-time updates so the project stays readable and maintainable.

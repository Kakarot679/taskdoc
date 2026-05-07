# Taskdoc

A collaborative team task management platform where admins can create projects, assign tasks, and manage team members, while members can track and update their work.

Built as a portfolio project to demonstrate full-stack skills with FastAPI, React, and MySQL.

---

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router DOM, Axios  
**Backend:** FastAPI, SQLAlchemy, Pydantic, JWT (python-jose), Passlib/Bcrypt  
**Database:** MySQL  
**Deployment:** Railway

---

## Features

- JWT-based auth with signup/login
- Role-based access control (admin vs member)
- Project creation and team membership management
- Task creation, assignment, priority, status, and due dates
- Overdue task detection
- Dashboard with task stats and upcoming deadlines
- Dedicated task workspace with filters and status updates
- Profile editing for account details
- Responsive UI with collapsible sidebar

---

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# create a .env file and add your MySQL credentials

uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install

# optional: create .env with VITE_API_URL=http://localhost:8000

npm run dev
```

App runs at `http://localhost:5173`.

---

## Environment Variables

### Backend `.env`
```
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
```
VITE_API_URL=http://localhost:8000
```

---

## Database

Tables are auto-created when the backend starts (SQLAlchemy `create_all`).  
Just make sure the database `taskdoc_db` exists in MySQL:

```sql
CREATE DATABASE taskdoc_db;
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | Login, get JWT token |
| GET | `/auth/me` | Get current user info |
| GET | `/projects` | List accessible projects |
| POST | `/projects` | Create project (admin) |
| GET | `/projects/{id}` | Get project details |
| DELETE | `/projects/{id}` | Delete project (admin) |
| GET | `/projects/{id}/members` | List project members |
| POST | `/projects/{id}/members` | Add member (admin) |
| DELETE | `/projects/{id}/members/{uid}` | Remove member (admin) |
| GET | `/tasks?project_id=` | List tasks |
| POST | `/tasks` | Create task (admin) |
| PUT | `/tasks/{id}` | Update task |
| DELETE | `/tasks/{id}` | Delete task (admin) |
| GET | `/dashboard/stats` | Dashboard summary stats |
| GET | `/users` | List all users (admin) |
| PUT | `/users/me` | Update current user's profile |

---

## Deployment (Railway)

Deploy this repo as an isolated monorepo with three Railway services:

1. MySQL database service
2. Backend service with root directory `/backend`
3. Frontend service with root directory `/frontend`

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

After both services have public domains, update `ALLOWED_ORIGINS` with the real frontend URL and redeploy the backend.

---

## What I'd Add Next

- Email notifications for task assignments
- Task comments
- File attachments on tasks
- Activity log per project
- Pagination on task lists
- Dark mode

---

## Notes

The project is intentionally scoped for a realistic fresher-level build with clean architecture, consistent UI, and a practical feature set without overengineering.

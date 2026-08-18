# Taskdoc

Taskdoc is a team task management app built around the kind of workflow a small team might actually use: projects, members, assigned tasks, due dates, status updates, and a dashboard for keeping an eye on progress.

I built it as a full-stack portfolio project using FastAPI, React, and MySQL. The goal was not to make a huge project management suite, but to build a clean and practical SaaS-style app with authentication, role-based access, useful APIs, and a responsive interface.

---

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS, React Router DOM, Axios  
**Backend:** FastAPI, SQLAlchemy, Pydantic, python-jose, Passlib/Bcrypt  
**Database:** MySQL  
**Testing:** pytest (backend), ESLint (frontend)  
**CI:** GitHub Actions — lint and tests run on every push  
**Deployment:** Railway

---

## What It Does

- Users can sign up, log in, and stay authenticated with JWT tokens.
- Admins can create projects, add team members, assign tasks, and manage project work.
- Members can view their assigned work and update task progress.
- Tasks support status, priority, due dates, and overdue tracking.
- Anyone who can see a task (the assignee, or an admin) can leave comments on it, so status updates don't have to carry all the context — this was the biggest gap in a *team* tool that otherwise had no way to talk about a task.
- Admins can promote another member to admin from the Team page, so a project isn't stuck with a single admin account the moment it needs a second one. The API refuses to demote the last remaining admin.
- The task list is paginated server-side (50 per page by default) instead of loading every task at once.
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

The backend is pinned to Python 3.12 via `.python-version`. That's not decorative — `pydantic-core` doesn't ship a prebuilt wheel for newer Python versions yet, and trying to build it from source fails without a Rust toolchain set up. If `pip install` starts trying to compile `pydantic-core`, you're on the wrong Python version.

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

## Testing

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

The suite covers auth (signup role assignment, login), projects, tasks (including the member-vs-admin permission rules), comments, role changes, and the request validation. It runs against an in-memory SQLite database via a dependency override, so it doesn't need a live MySQL instance — the same thing CI does.

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
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
| GET | `/tasks?project_id=&limit=&offset=` | List tasks, paginated (default `limit=50`, max `200`) |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/{id}` | Update a task |
| DELETE | `/tasks/{id}` | Delete a task |
| GET | `/tasks/{id}/comments` | List comments on a task |
| POST | `/tasks/{id}/comments` | Add a comment to a task |
| DELETE | `/tasks/{id}/comments/{comment_id}` | Delete a comment (its author, or an admin) |
| GET | `/dashboard/stats` | Get dashboard stats |
| GET | `/users` | List users |
| PUT | `/users/me` | Update profile details |
| PUT | `/users/{id}/role` | Change a user's role between `admin` and `member` |

Some endpoints are role-protected. For example, project creation, member management, task assignment, deletes, and role changes are admin-only actions. `GET /tasks` returns `{items, total, limit, offset}` rather than a bare array. A member can only see and comment on tasks assigned to them; an admin can see and comment on any task. The role endpoint refuses to demote the last remaining admin, so you can't accidentally lock a team out of its own admin panel.

---

## Deployment Notes

The live demo was on Railway's free trial, which has since run out — the instructions below still work if you're paying for Railway or reactivate the trial, but the site isn't up right now. See the free alternative further down if you want to redeploy it without a card on file.

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

### Free alternative: Render + Aiven

Since the Railway trial is gone, here's a genuinely free path if you want this running live again — no card required on either side, as of writing:

1. **Database:** [Aiven](https://aiven.io/free-tier) has an always-free MySQL plan (1 GB storage/RAM). Create a service, grab the connection details.
2. **Backend:** a Render web service, root directory `backend`, build command `pip install -r requirements.txt`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set the same backend variables as above, pointed at Aiven instead of Railway's MySQL. Aiven's MySQL requires TLS — the simplest way to handle that is to skip the individual `DB_HOST`/`DB_PORT`/etc. variables and set `DATABASE_URL` directly to the full connection string Aiven gives you (`db.py` already prefers `DATABASE_URL` over the individual fields if it's set, so nothing in the code needs to change).
3. **Frontend:** a Render static site, root directory `frontend`, build command `npm run build`, publish directory `dist`. Set `VITE_API_URL` to the Render backend's URL.
4. Update `ALLOWED_ORIGINS` on the backend to the Render frontend's URL, same as the Railway flow.

Render's free web services spin down after inactivity and take a few seconds to wake back up on the next request — worth knowing if you're linking this from a resume and someone clicks it cold.

---

## Possible Improvements

- Email notifications for task assignments
- File attachments
- Activity history for projects (comments cover per-task discussion now, but there's still no audit trail for who changed what on a project)
- Server-side search/filtering on the task list — right now the Tasks page filters run client-side against whatever page is loaded, so a filter only searches the current page, not the whole list. Fine at the task counts this app is built for; would need to move into the query if that stopped being true.
- Dark mode

---

## Project Scope

Taskdoc is intentionally kept at a realistic portfolio-project size. It focuses on the core pieces that matter in a team workflow: auth, roles, projects, tasks, validation, and a usable dashboard. I avoided heavier patterns like Redux, microservices, drag-and-drop boards, or real-time updates so the project stays readable and maintainable.

The two additions since the first version — task comments and admin role promotion — went in because they were the actual dead ends in a *team* tool, not because they made the feature list longer: there was no way to discuss a task without leaving the app, and no way to add a second admin without editing the database by hand. Pagination on the task list followed the same reasoning as the rest of the scope decisions above: it's a real gap at production scale, so it's there, done as plainly as the rest of the API rather than as an excuse to add more moving parts.

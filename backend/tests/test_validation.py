def test_signup_name_too_long_rejected(client):
    resp = client.post(
        "/auth/signup",
        json={"name": "x" * 101, "email": "long@example.com", "password": "testpass123"},
    )
    assert resp.status_code == 422


def test_signup_email_too_long_rejected(client):
    long_email = ("x" * 145) + "@a.com"  # > 150 chars
    resp = client.post(
        "/auth/signup",
        json={"name": "Someone", "email": long_email, "password": "testpass123"},
    )
    assert resp.status_code == 422


def test_project_title_too_long_rejected(client, admin):
    resp = client.post(
        "/projects/", json={"title": "x" * 201}, headers=admin["headers"]
    )
    assert resp.status_code == 422


def test_task_title_too_long_rejected(client, admin):
    proj = client.post("/projects/", json={"title": "Project"}, headers=admin["headers"]).json()
    resp = client.post(
        "/tasks/",
        json={"title": "x" * 201, "project_id": proj["id"]},
        headers=admin["headers"],
    )
    assert resp.status_code == 422


def test_comment_body_too_long_rejected(client, admin):
    proj = client.post("/projects/", json={"title": "Project"}, headers=admin["headers"]).json()
    task = client.post(
        "/tasks/", json={"title": "Task", "project_id": proj["id"]}, headers=admin["headers"]
    ).json()
    resp = client.post(
        f"/tasks/{task['id']}/comments/",
        json={"body": "x" * 2001},
        headers=admin["headers"],
    )
    assert resp.status_code == 422

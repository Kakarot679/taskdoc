from datetime import date, timedelta

TOMORROW = (date.today() + timedelta(days=1)).isoformat()
YESTERDAY = (date.today() - timedelta(days=1)).isoformat()


def _make_project(client, admin, title="Project"):
    return client.post("/projects/", json={"title": title}, headers=admin["headers"]).json()


def test_admin_can_create_task(client, admin):
    proj = _make_project(client, admin)
    resp = client.post(
        "/tasks/",
        json={"title": "Design homepage", "project_id": proj["id"], "priority": "high"},
        headers=admin["headers"],
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "todo"
    assert resp.json()["priority"] == "high"


def test_member_cannot_create_task(client, admin, member):
    proj = _make_project(client, admin)
    resp = client.post(
        "/tasks/", json={"title": "Sneaky", "project_id": proj["id"]}, headers=member["headers"]
    )
    assert resp.status_code == 403


def test_create_task_missing_project_404(client, admin):
    resp = client.post(
        "/tasks/", json={"title": "Orphan", "project_id": 999}, headers=admin["headers"]
    )
    assert resp.status_code == 404


def test_create_task_past_due_date_rejected(client, admin):
    proj = _make_project(client, admin)
    resp = client.post(
        "/tasks/",
        json={"title": "Late", "project_id": proj["id"], "due_date": YESTERDAY},
        headers=admin["headers"],
    )
    assert resp.status_code == 400


def test_create_task_future_due_date_accepted(client, admin):
    proj = _make_project(client, admin)
    resp = client.post(
        "/tasks/",
        json={"title": "On time", "project_id": proj["id"], "due_date": TOMORROW},
        headers=admin["headers"],
    )
    assert resp.status_code == 201


def test_create_task_invalid_status_rejected(client, admin):
    proj = _make_project(client, admin)
    resp = client.post(
        "/tasks/",
        json={"title": "Bad status", "project_id": proj["id"], "status": "archived"},
        headers=admin["headers"],
    )
    assert resp.status_code == 422


def test_assigning_task_adds_user_as_project_member(client, admin, member):
    proj = _make_project(client, admin)
    resp = client.post(
        "/tasks/",
        json={
            "title": "Design homepage",
            "project_id": proj["id"],
            "assigned_to": member["user"]["id"],
        },
        headers=admin["headers"],
    )
    assert resp.status_code == 201

    members = client.get(f"/projects/{proj['id']}/members", headers=admin["headers"]).json()
    assert any(m["id"] == member["user"]["id"] for m in members)


def test_assign_task_to_unknown_user_404(client, admin):
    proj = _make_project(client, admin)
    resp = client.post(
        "/tasks/",
        json={"title": "Orphan assignee", "project_id": proj["id"], "assigned_to": 999},
        headers=admin["headers"],
    )
    assert resp.status_code == 404


def test_member_can_view_own_task(client, admin, member):
    proj = _make_project(client, admin)
    task = client.post(
        "/tasks/",
        json={"title": "Mine", "project_id": proj["id"], "assigned_to": member["user"]["id"]},
        headers=admin["headers"],
    ).json()

    resp = client.get(f"/tasks/{task['id']}", headers=member["headers"])
    assert resp.status_code == 200


def test_member_cannot_view_unassigned_task(client, admin, member):
    proj = _make_project(client, admin)
    task = client.post(
        "/tasks/", json={"title": "Not mine", "project_id": proj["id"]}, headers=admin["headers"]
    ).json()

    resp = client.get(f"/tasks/{task['id']}", headers=member["headers"])
    assert resp.status_code == 403


def test_member_can_only_update_status_of_own_task(client, admin, member):
    proj = _make_project(client, admin)
    task = client.post(
        "/tasks/",
        json={"title": "Mine", "project_id": proj["id"], "assigned_to": member["user"]["id"]},
        headers=admin["headers"],
    ).json()

    resp = client.put(
        f"/tasks/{task['id']}",
        json={"title": "HACKED", "status": "completed"},
        headers=member["headers"],
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "completed"
    assert body["title"] == "Mine"  # title change silently ignored for members


def test_member_cannot_update_others_task(client, admin, member):
    proj = _make_project(client, admin)
    task = client.post(
        "/tasks/", json={"title": "Not mine", "project_id": proj["id"]}, headers=admin["headers"]
    ).json()

    resp = client.put(
        f"/tasks/{task['id']}", json={"status": "completed"}, headers=member["headers"]
    )
    assert resp.status_code == 403


def test_admin_can_update_all_fields(client, admin):
    proj = _make_project(client, admin)
    task = client.post(
        "/tasks/", json={"title": "Original", "project_id": proj["id"]}, headers=admin["headers"]
    ).json()

    resp = client.put(
        f"/tasks/{task['id']}",
        json={"title": "Updated", "priority": "low", "due_date": TOMORROW},
        headers=admin["headers"],
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Updated"
    assert body["priority"] == "low"


def test_admin_update_past_due_date_rejected(client, admin):
    proj = _make_project(client, admin)
    task = client.post(
        "/tasks/", json={"title": "Original", "project_id": proj["id"]}, headers=admin["headers"]
    ).json()

    resp = client.put(
        f"/tasks/{task['id']}", json={"due_date": YESTERDAY}, headers=admin["headers"]
    )
    assert resp.status_code == 400


def test_member_cannot_delete_task(client, admin, member):
    proj = _make_project(client, admin)
    task = client.post(
        "/tasks/",
        json={"title": "Mine", "project_id": proj["id"], "assigned_to": member["user"]["id"]},
        headers=admin["headers"],
    ).json()

    resp = client.delete(f"/tasks/{task['id']}", headers=member["headers"])
    assert resp.status_code == 403


def test_admin_can_delete_task(client, admin):
    proj = _make_project(client, admin)
    task = client.post(
        "/tasks/", json={"title": "Doomed", "project_id": proj["id"]}, headers=admin["headers"]
    ).json()

    resp = client.delete(f"/tasks/{task['id']}", headers=admin["headers"])
    assert resp.status_code == 204
    assert client.get(f"/tasks/{task['id']}", headers=admin["headers"]).status_code == 404


def test_list_tasks_scoped_to_member_assignments(client, admin, member):
    proj = _make_project(client, admin)
    client.post(
        "/tasks/",
        json={"title": "Mine", "project_id": proj["id"], "assigned_to": member["user"]["id"]},
        headers=admin["headers"],
    )
    client.post(
        "/tasks/", json={"title": "Not mine", "project_id": proj["id"]}, headers=admin["headers"]
    )

    resp = client.get("/tasks/", headers=member["headers"])
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    titles = [t["title"] for t in body["items"]]
    assert titles == ["Mine"]


def test_list_tasks_by_project_requires_membership(client, admin, member):
    proj = _make_project(client, admin)
    resp = client.get(f"/tasks/?project_id={proj['id']}", headers=member["headers"])
    assert resp.status_code == 403

def _make_project_and_task(client, admin, assigned_to=None):
    proj = client.post("/projects/", json={"title": "Project"}, headers=admin["headers"]).json()
    payload = {"title": "Task", "project_id": proj["id"]}
    if assigned_to is not None:
        payload["assigned_to"] = assigned_to
    task = client.post("/tasks/", json=payload, headers=admin["headers"]).json()
    return proj, task


def test_admin_can_comment_on_any_task(client, admin, member):
    proj, task = _make_project_and_task(client, admin, assigned_to=member["user"]["id"])
    resp = client.post(
        f"/tasks/{task['id']}/comments/", json={"body": "Looks good"}, headers=admin["headers"]
    )
    assert resp.status_code == 201
    assert resp.json()["body"] == "Looks good"
    assert resp.json()["author"]["id"] == admin["user"]["id"]


def test_member_can_comment_on_own_task(client, admin, member):
    proj, task = _make_project_and_task(client, admin, assigned_to=member["user"]["id"])
    resp = client.post(
        f"/tasks/{task['id']}/comments/", json={"body": "On it"}, headers=member["headers"]
    )
    assert resp.status_code == 201


def test_member_cannot_comment_on_unassigned_task(client, admin, member):
    proj, task = _make_project_and_task(client, admin)
    resp = client.post(
        f"/tasks/{task['id']}/comments/", json={"body": "Nosy"}, headers=member["headers"]
    )
    assert resp.status_code == 403


def test_comment_on_missing_task_404(client, admin):
    resp = client.post(
        "/tasks/999/comments/", json={"body": "Hello"}, headers=admin["headers"]
    )
    assert resp.status_code == 404


def test_empty_comment_rejected(client, admin):
    proj, task = _make_project_and_task(client, admin)
    resp = client.post(
        f"/tasks/{task['id']}/comments/", json={"body": "   "}, headers=admin["headers"]
    )
    assert resp.status_code == 422


def test_list_comments_ordered(client, admin, member):
    proj, task = _make_project_and_task(client, admin, assigned_to=member["user"]["id"])
    url = f"/tasks/{task['id']}/comments/"
    client.post(url, json={"body": "First"}, headers=admin["headers"])
    client.post(url, json={"body": "Second"}, headers=member["headers"])

    resp = client.get(f"/tasks/{task['id']}/comments/", headers=admin["headers"])
    assert resp.status_code == 200
    bodies = [c["body"] for c in resp.json()]
    assert bodies == ["First", "Second"]


def test_member_cannot_view_comments_on_unassigned_task(client, admin, member):
    proj, task = _make_project_and_task(client, admin)
    client.post(f"/tasks/{task['id']}/comments/", json={"body": "Secret"}, headers=admin["headers"])

    resp = client.get(f"/tasks/{task['id']}/comments/", headers=member["headers"])
    assert resp.status_code == 403


def test_author_can_delete_own_comment(client, admin, member):
    proj, task = _make_project_and_task(client, admin, assigned_to=member["user"]["id"])
    comment = client.post(
        f"/tasks/{task['id']}/comments/", json={"body": "Oops"}, headers=member["headers"]
    ).json()

    resp = client.delete(
        f"/tasks/{task['id']}/comments/{comment['id']}", headers=member["headers"]
    )
    assert resp.status_code == 204


def test_member_cannot_delete_others_comment(client, admin, member):
    proj, task = _make_project_and_task(client, admin, assigned_to=member["user"]["id"])
    comment = client.post(
        f"/tasks/{task['id']}/comments/", json={"body": "Admin note"}, headers=admin["headers"]
    ).json()

    resp = client.delete(
        f"/tasks/{task['id']}/comments/{comment['id']}", headers=member["headers"]
    )
    assert resp.status_code == 403


def test_admin_can_delete_any_comment(client, admin, member):
    proj, task = _make_project_and_task(client, admin, assigned_to=member["user"]["id"])
    comment = client.post(
        f"/tasks/{task['id']}/comments/", json={"body": "Delete me"}, headers=member["headers"]
    ).json()

    resp = client.delete(
        f"/tasks/{task['id']}/comments/{comment['id']}", headers=admin["headers"]
    )
    assert resp.status_code == 204


def test_deleting_task_cascades_comments(client, admin):
    proj, task = _make_project_and_task(client, admin)
    client.post(f"/tasks/{task['id']}/comments/", json={"body": "Bye"}, headers=admin["headers"])

    resp = client.delete(f"/tasks/{task['id']}", headers=admin["headers"])
    assert resp.status_code == 204

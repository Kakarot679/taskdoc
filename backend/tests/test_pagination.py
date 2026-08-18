def _make_project(client, admin, title="Project"):
    return client.post("/projects/", json={"title": title}, headers=admin["headers"]).json()


def _make_tasks(client, admin, proj, count):
    for i in range(count):
        payload = {"title": f"Task {i}", "project_id": proj["id"]}
        client.post("/tasks/", json=payload, headers=admin["headers"])


def test_list_tasks_default_pagination(client, admin):
    proj = _make_project(client, admin)
    _make_tasks(client, admin, proj, 3)

    resp = client.get("/tasks/", headers=admin["headers"])
    body = resp.json()
    assert body["total"] == 3
    assert body["limit"] == 50
    assert body["offset"] == 0
    assert len(body["items"]) == 3


def test_list_tasks_limit_and_offset(client, admin):
    proj = _make_project(client, admin)
    _make_tasks(client, admin, proj, 5)

    resp = client.get("/tasks/?limit=2&offset=0", headers=admin["headers"])
    body = resp.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2

    resp2 = client.get("/tasks/?limit=2&offset=2", headers=admin["headers"])
    body2 = resp2.json()
    assert len(body2["items"]) == 2
    # pages don't overlap
    ids_page1 = {t["id"] for t in body["items"]}
    ids_page2 = {t["id"] for t in body2["items"]}
    assert ids_page1.isdisjoint(ids_page2)


def test_list_tasks_limit_capped(client, admin):
    resp = client.get("/tasks/?limit=500", headers=admin["headers"])
    assert resp.status_code == 422


def test_list_tasks_negative_offset_rejected(client, admin):
    resp = client.get("/tasks/?offset=-1", headers=admin["headers"])
    assert resp.status_code == 422

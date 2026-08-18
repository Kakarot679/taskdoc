def test_admin_can_create_project(client, admin):
    resp = client.post(
        "/projects/",
        json={"title": "Website Redesign", "description": "Q3 revamp"},
        headers=admin["headers"],
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Website Redesign"
    assert body["created_by"] == admin["user"]["id"]
    # creator is auto-added as a member
    assert body["member_count"] == 1


def test_member_cannot_create_project(client, member):
    resp = client.post("/projects/", json={"title": "Hack"}, headers=member["headers"])
    assert resp.status_code == 403


def test_create_project_empty_title_rejected(client, admin):
    resp = client.post("/projects/", json={"title": "   "}, headers=admin["headers"])
    assert resp.status_code == 422


def test_list_projects_admin_sees_all(client, admin, member):
    client.post("/projects/", json={"title": "Project A"}, headers=admin["headers"])
    client.post("/projects/", json={"title": "Project B"}, headers=admin["headers"])

    resp = client.get("/projects/", headers=admin["headers"])
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_projects_member_sees_only_theirs(client, admin, member):
    proj = client.post("/projects/", json={"title": "Project A"}, headers=admin["headers"]).json()
    client.post("/projects/", json={"title": "Project B"}, headers=admin["headers"])
    client.post(
        f"/projects/{proj['id']}/members",
        json={"user_id": member["user"]["id"]},
        headers=admin["headers"],
    )

    resp = client.get("/projects/", headers=member["headers"])
    assert resp.status_code == 200
    titles = [p["title"] for p in resp.json()]
    assert titles == ["Project A"]


def test_get_project_404(client, admin):
    resp = client.get("/projects/999", headers=admin["headers"])
    assert resp.status_code == 404


def test_get_project_403_for_non_member(client, admin, member):
    proj = client.post("/projects/", json={"title": "Private"}, headers=admin["headers"]).json()
    resp = client.get(f"/projects/{proj['id']}", headers=member["headers"])
    assert resp.status_code == 403


def test_update_project_member_forbidden(client, admin, member):
    proj = client.post("/projects/", json={"title": "Original"}, headers=admin["headers"]).json()
    resp = client.put(
        f"/projects/{proj['id']}", json={"title": "Hacked"}, headers=member["headers"]
    )
    assert resp.status_code == 403


def test_update_project_admin(client, admin):
    proj = client.post("/projects/", json={"title": "Original"}, headers=admin["headers"]).json()
    resp = client.put(
        f"/projects/{proj['id']}", json={"title": "Renamed"}, headers=admin["headers"]
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "Renamed"


def test_delete_project_member_forbidden(client, admin, member):
    proj = client.post("/projects/", json={"title": "Doomed"}, headers=admin["headers"]).json()
    resp = client.delete(f"/projects/{proj['id']}", headers=member["headers"])
    assert resp.status_code == 403


def test_delete_project_admin(client, admin):
    proj = client.post("/projects/", json={"title": "Doomed"}, headers=admin["headers"]).json()
    resp = client.delete(f"/projects/{proj['id']}", headers=admin["headers"])
    assert resp.status_code == 204
    assert client.get(f"/projects/{proj['id']}", headers=admin["headers"]).status_code == 404


def test_add_member(client, admin, member):
    proj = client.post(
        "/projects/", json={"title": "Team Project"}, headers=admin["headers"]
    ).json()
    resp = client.post(
        f"/projects/{proj['id']}/members",
        json={"user_id": member["user"]["id"]},
        headers=admin["headers"],
    )
    assert resp.status_code == 201

    members = client.get(f"/projects/{proj['id']}/members", headers=admin["headers"]).json()
    assert any(m["id"] == member["user"]["id"] for m in members)


def test_add_duplicate_member_rejected(client, admin, member):
    proj = client.post(
        "/projects/", json={"title": "Team Project"}, headers=admin["headers"]
    ).json()
    client.post(
        f"/projects/{proj['id']}/members",
        json={"user_id": member["user"]["id"]},
        headers=admin["headers"],
    )
    resp = client.post(
        f"/projects/{proj['id']}/members",
        json={"user_id": member["user"]["id"]},
        headers=admin["headers"],
    )
    assert resp.status_code == 400


def test_member_cannot_add_member(client, admin, member):
    proj = client.post(
        "/projects/", json={"title": "Team Project"}, headers=admin["headers"]
    ).json()
    resp = client.post(
        f"/projects/{proj['id']}/members",
        json={"user_id": member["user"]["id"]},
        headers=member["headers"],
    )
    assert resp.status_code == 403


def test_remove_member(client, admin, member):
    proj = client.post(
        "/projects/", json={"title": "Team Project"}, headers=admin["headers"]
    ).json()
    client.post(
        f"/projects/{proj['id']}/members",
        json={"user_id": member["user"]["id"]},
        headers=admin["headers"],
    )
    resp = client.delete(
        f"/projects/{proj['id']}/members/{member['user']['id']}", headers=admin["headers"]
    )
    assert resp.status_code == 204

    members = client.get(f"/projects/{proj['id']}/members", headers=admin["headers"]).json()
    assert not any(m["id"] == member["user"]["id"] for m in members)

def test_admin_can_promote_member(client, admin, member):
    resp = client.put(
        f"/users/{member['user']['id']}/role",
        json={"role": "admin"},
        headers=admin["headers"],
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "admin"


def test_member_cannot_change_roles(client, admin, member):
    resp = client.put(
        f"/users/{admin['user']['id']}/role",
        json={"role": "member"},
        headers=member["headers"],
    )
    assert resp.status_code == 403


def test_cannot_demote_last_admin(client, admin, member):
    resp = client.put(
        f"/users/{admin['user']['id']}/role",
        json={"role": "member"},
        headers=admin["headers"],
    )
    assert resp.status_code == 400


def test_can_demote_admin_when_another_admin_exists(client, admin, member):
    client.put(
        f"/users/{member['user']['id']}/role", json={"role": "admin"}, headers=admin["headers"]
    )
    resp = client.put(
        f"/users/{admin['user']['id']}/role", json={"role": "member"}, headers=admin["headers"]
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "member"


def test_role_update_unknown_user_404(client, admin):
    resp = client.put("/users/999/role", json={"role": "admin"}, headers=admin["headers"])
    assert resp.status_code == 404


def test_role_update_invalid_value_rejected(client, admin, member):
    resp = client.put(
        f"/users/{member['user']['id']}/role",
        json={"role": "superadmin"},
        headers=admin["headers"],
    )
    assert resp.status_code == 422


def test_promoted_member_gains_admin_endpoints(client, admin, member):
    client.put(
        f"/users/{member['user']['id']}/role", json={"role": "admin"}, headers=admin["headers"]
    )
    resp = client.post("/projects/", json={"title": "Now allowed"}, headers=member["headers"])
    assert resp.status_code == 201

"""
Room Configurator usage stats: the public event endpoint and the admin
dashboard endpoint. Uses are counted for every visitor, and nothing about the
visitor (IP address, browser) is stored. Events recorded by these tests are
deleted afterwards.
"""
import os

import pytest
from pymongo import MongoClient

from auth import create_access_token

STORED_FIELDS = {"_id", "id", "event", "created_at", "day"}


@pytest.fixture(scope="module")
def admin_headers():
    # get_current_user only verifies the JWT, so a freshly signed token is enough.
    return {"Authorization": f"Bearer {create_access_token({'sub': 'usage-test'})}"}


@pytest.fixture(scope="module")
def usage_collection():
    with MongoClient(os.environ["MONGO_URL"]) as mongo:
        collection = mongo[os.environ["DB_NAME"]].configurator_usage
        existing = {doc["_id"] for doc in collection.find({}, {"_id": 1})}
        yield collection, existing
        collection.delete_many({"_id": {"$nin": list(existing)}})


def test_counts_uses_without_storing_visitor_details(client, admin_headers, usage_collection):
    collection, existing = usage_collection
    for event in ("open", "open", "export"):
        r = client.post(
            "/api/analytics/room-configurator",
            json={"event": event},
            headers={"X-Forwarded-For": "203.0.113.250", "User-Agent": "usage-test-browser/1.0"},
        )
        assert r.status_code == 200

    stored = [doc for doc in collection.find({}) if doc["_id"] not in existing]
    assert sorted(doc["event"] for doc in stored) == ["export", "open", "open"]
    assert all(set(doc) == STORED_FIELDS for doc in stored)

    stats = client.get("/api/admin/analytics/room-configurator", headers=admin_headers).json()
    assert all(set(e) == {"event", "created_at"} for e in stats["entries"])
    assert stats["today"]["uses"] >= 2
    assert stats["today"]["exports"] >= 1
    assert set(stats["today"]) == {"date", "uses", "exports"}
    assert stats["daily"][-1]["date"] == stats["selected_date"]
    assert len(stats["daily"]) == 14


def test_rejects_unknown_event(client):
    r = client.post("/api/analytics/room-configurator", json={"event": "delete-everything"})
    assert r.status_code == 400


def test_stats_require_admin(client):
    r = client.get("/api/admin/analytics/room-configurator")
    assert r.status_code in (401, 403)


def test_selecting_a_day_and_clamping_range(client, admin_headers):
    stats = client.get(
        "/api/admin/analytics/room-configurator",
        params={"days": 500, "date": "2020-01-01"},
        headers=admin_headers,
    ).json()
    assert len(stats["daily"]) == 90
    assert stats["selected_date"] == "2020-01-01"
    assert stats["entries"] == []

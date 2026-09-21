"""
Contact-form submissions hold names, emails, phone numbers and messages, so
listing them is admin-only. Rows are seeded straight into Mongo (posting to
/api/contact would send a real notification email) and deleted afterwards.
"""
import os
import uuid
from datetime import datetime

import pytest
from pymongo import MongoClient

from auth import create_access_token


@pytest.fixture(scope="module")
def admin_headers():
    # get_current_user only verifies the JWT, so a freshly signed token is enough.
    return {"Authorization": f"Bearer {create_access_token({'sub': 'contacts-test'})}"}


@pytest.fixture(scope="module")
def seeded_contact():
    contact = {
        "id": str(uuid.uuid4()),
        "name": "TEST_Contact",
        "company": "Test Company",
        "email": "contacts-test@example.com",
        "phone": "555-1234",
        "topic": "General Inquiry",
        "preferred_date": None,
        "message": "Seeded by test_contacts_admin.py",
        "created_at": datetime.utcnow(),
    }
    with MongoClient(os.environ["MONGO_URL"]) as mongo:
        collection = mongo[os.environ["DB_NAME"]].contacts
        collection.insert_one(dict(contact))
        yield contact
        collection.delete_one({"id": contact["id"]})


def test_listing_requires_admin(client, seeded_contact):
    r = client.get("/api/admin/contacts")
    assert r.status_code in (401, 403)

    r = client.get("/api/admin/contacts", headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code == 401


def test_old_public_path_is_gone(client, seeded_contact):
    r = client.get("/api/contacts")
    assert r.status_code in (404, 405)
    assert seeded_contact["email"] not in r.text


def test_admin_can_list_contacts(client, admin_headers, seeded_contact):
    r = client.get("/api/admin/contacts", headers=admin_headers)
    assert r.status_code == 200
    listed = {c["id"]: c for c in r.json()}
    assert listed[seeded_contact["id"]]["email"] == seeded_contact["email"]

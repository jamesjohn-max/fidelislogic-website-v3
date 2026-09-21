"""
Admin accounts can only be made on the server: there's no web endpoint for it, the
backend won't run with a missing or published JWT signing key, and
scripts/create_admin.py creates admins or resets their passwords. The script is run
against whatever database the tests use (MONGO_URL / DB_NAME) and cleans up after.
"""
import os
import subprocess
import sys
import uuid
from pathlib import Path

import pytest
from pymongo import MongoClient

from auth import verify_password

BACKEND_DIR = Path(__file__).resolve().parent.parent
SCRIPT = BACKEND_DIR / "scripts" / "create_admin.py"
GOOD_PASSWORD = "correct-horse-battery"


def test_there_is_no_endpoint_for_creating_admins(client):
    r = client.post("/api/auth/create-admin", params={"username": "intruder", "password": "x" * 16})
    assert r.status_code in (404, 405)


@pytest.mark.parametrize(
    "key, message",
    [
        ("", "JWT_SECRET_KEY is not set"),
        ("fidelis-logic-secret-key-change-in-production", "publicly known value"),
        ("dev-only-secret-change-me-in-production", "publicly known value"),
    ],
)
def test_the_backend_refuses_a_missing_or_published_jwt_key(key, message):
    env = {**os.environ, "JWT_SECRET_KEY": key}
    r = subprocess.run([sys.executable, "-c", "import auth"], cwd=BACKEND_DIR, env=env, capture_output=True, text=True)
    assert r.returncode != 0
    assert message in r.stderr


@pytest.fixture
def username():
    name = f"test-admin-{uuid.uuid4().hex[:8]}"
    yield name
    MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]].users.delete_many({"username": name})


def run_script(*args, stdin=""):
    return subprocess.run([sys.executable, str(SCRIPT), *args], cwd=BACKEND_DIR, input=stdin, capture_output=True, text=True)


def stored_hash(name):
    user = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]].users.find_one({"username": name})
    return user and user["hashed_password"]


def test_the_script_creates_an_admin_who_can_log_in(client, username):
    r = run_script(username, stdin=f"{GOOD_PASSWORD}\n{GOOD_PASSWORD}\n")
    assert r.returncode == 0, r.stderr
    assert f'Created admin "{username}"' in r.stdout
    assert verify_password(GOOD_PASSWORD, stored_hash(username))
    login = client.post("/api/auth/login", json={"username": username, "password": GOOD_PASSWORD})
    assert login.status_code == 200 and login.json()["access_token"]


def test_the_script_refuses_short_or_mismatched_passwords(username):
    assert "at least 12 characters" in run_script(username, stdin="short\nshort\n").stderr
    assert "don't match" in run_script(username, stdin=f"{GOOD_PASSWORD}\n{GOOD_PASSWORD}x\n").stderr
    assert stored_hash(username) is None


def test_an_existing_admin_needs_reset_to_change_password(username):
    run_script(username, stdin=f"{GOOD_PASSWORD}\n{GOOD_PASSWORD}\n")
    again = run_script(username, stdin=f"{GOOD_PASSWORD}\n{GOOD_PASSWORD}\n")
    assert again.returncode != 0 and "--reset" in again.stderr

    new_password = "another-long-passphrase"
    reset = run_script(username, "--reset", stdin=f"{new_password}\n{new_password}\n")
    assert reset.returncode == 0, reset.stderr
    assert verify_password(new_password, stored_hash(username))


def test_reset_needs_an_existing_admin(username):
    r = run_script(username, "--reset", stdin=f"{GOOD_PASSWORD}\n{GOOD_PASSWORD}\n")
    assert r.returncode != 0 and "run without --reset" in r.stderr

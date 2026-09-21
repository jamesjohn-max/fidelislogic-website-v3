"""
Shared fixtures for backend tests.

Motor's AsyncIOMotorClient binds to the first event loop that touches it, and
starlette's TestClient creates + tears down a fresh loop per instance. Two
TestClient instances in one pytest session therefore make Motor raise
"Event loop is closed". A single SESSION-scoped client avoids that.
"""
import sys

import pytest

sys.path.insert(0, "/app/backend")

from starlette.testclient import TestClient  # noqa: E402
from server import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app, follow_redirects=False) as c:
        yield c

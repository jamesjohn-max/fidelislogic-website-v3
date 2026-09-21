"""
Create an admin user for /admin — or, with --reset, set a new password for one.

There's deliberately no web endpoint for this (anyone could use one to make
themselves an admin), so it's run on the server, against the database named in
backend/.env. The backend doesn't need to be running.

    python scripts/create_admin.py admin            # asks for the password twice
    python scripts/create_admin.py admin --reset    # new password for "admin"
"""
import argparse
import asyncio
import getpass
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")
sys.path.insert(0, str(BACKEND_DIR))

from auth import get_password_hash  # noqa: E402  (reads JWT_SECRET_KEY from .env)
from blog_models import User  # noqa: E402

MIN_PASSWORD_LENGTH = 12


def ask_password():
    password = getpass.getpass("Password: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        sys.exit(f"The password must be at least {MIN_PASSWORD_LENGTH} characters.")
    if getpass.getpass("Confirm password: ") != password:
        sys.exit("The passwords don't match.")
    return password


async def main():
    parser = argparse.ArgumentParser(description="Create an admin user for /admin, or reset its password.")
    parser.add_argument("username")
    parser.add_argument("--reset", action="store_true", help="set a new password for an existing admin")
    args = parser.parse_args()
    username = args.username.strip()
    if not username:
        sys.exit("The username can't be empty.")

    db_name = os.environ["DB_NAME"]
    db = AsyncIOMotorClient(os.environ["MONGO_URL"])[db_name]
    # Checked before asking for a password, so nobody types one in for nothing.
    exists = await db.users.find_one({"username": username}) is not None
    if exists and not args.reset:
        sys.exit(f'Admin "{username}" already exists in database "{db_name}" — add --reset to set a new password.')
    if args.reset and not exists:
        sys.exit(f'There is no admin "{username}" in database "{db_name}" — run without --reset to create one.')

    hashed_password = get_password_hash(ask_password())
    if args.reset:
        await db.users.update_one({"username": username}, {"$set": {"hashed_password": hashed_password}})
        print(f'Set a new password for admin "{username}" in database "{db_name}".')
    else:
        await db.users.insert_one(User(username=username, hashed_password=hashed_password).model_dump())
        print(f'Created admin "{username}" in database "{db_name}".')


if __name__ == "__main__":
    asyncio.run(main())

"""Create a test agency and owner for local development. Safe to run more than once.

Run from backend/: python -m scripts.seed_dev
Never run this against a real database: the login below is public in the repository.
"""

from sqlalchemy import select

from app.db import SessionLocal
from app.models import User, UserRole
from scripts.create_user import create_user

DEV_AGENCY = "Pixel Agency (test)"
DEV_EMAIL = "owner@pixel-agency.test"
DEV_PASSWORD = "local-dev-only-2026"
DEV_NAME = "Test Owner"


def main() -> None:
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.email == DEV_EMAIL)):
            print(f"{DEV_EMAIL} already exists.")
            return
    create_user(DEV_AGENCY, DEV_EMAIL, DEV_NAME, UserRole.owner, DEV_PASSWORD)
    print(f"Created {DEV_EMAIL} in {DEV_AGENCY}. The password is in scripts/seed_dev.py.")


if __name__ == "__main__":
    main()

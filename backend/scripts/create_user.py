"""Create an agency user. The password is asked for, never passed on the command line.

Run from backend/:
    python -m scripts.create_user --agency "Pixel Agency" --email ravi@pixel.in --name "Ravi Soni" --role owner
The agency is created if no agency with that name exists yet.
"""

import argparse
import getpass

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Agency, User, UserRole
from app.security import hash_password


def create_user(agency_name: str, email: str, full_name: str, role: UserRole, password: str) -> User:
    with SessionLocal() as db:
        email = email.strip().lower()
        if db.scalar(select(User).where(User.email == email)):
            raise SystemExit(f"A user with the email {email} already exists.")
        agency = db.scalar(select(Agency).where(Agency.name == agency_name))
        if agency is None:
            agency = Agency(name=agency_name)
            db.add(agency)
        user = User(agency=agency, email=email, full_name=full_name, role=role, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        return user


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--agency", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--role", choices=[r.value for r in UserRole], default=UserRole.member.value)
    args = parser.parse_args()

    password = getpass.getpass("Password (at least 10 characters): ")
    if len(password) < 10:
        raise SystemExit("The password needs at least 10 characters.")
    if getpass.getpass("Type it again: ") != password:
        raise SystemExit("The passwords don't match.")

    create_user(args.agency, args.email, args.name, UserRole(args.role), password)
    print(f"Created {args.email} in {args.agency}.")


if __name__ == "__main__":
    main()

"""Check that the backend can reach the local database. Run from backend/: python -m scripts.check_db"""

from sqlalchemy import text

from app.db import engine

with engine.connect() as conn:
    version = conn.execute(text("SHOW server_version")).scalar()
    user, database = conn.execute(text("SELECT current_user, current_database()")).one()
    print(f"Connected: PostgreSQL {version}, user {user}, database {database}")

    rows = conn.execute(
        text(
            "SELECT name, installed_version FROM pg_available_extensions "
            "WHERE name IN ('postgis', 'pg_trgm') ORDER BY name"
        )
    ).all()
    found = {name: installed for name, installed in rows}
    for ext in ("pg_trgm", "postgis"):
        if ext not in found:
            print(f"  {ext}: not available on this server")
        elif found[ext] is None:
            print(f"  {ext}: available, not yet enabled in this database")
        else:
            print(f"  {ext}: enabled (version {found[ext]})")

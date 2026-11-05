# tirupati-impex-claude

A lead generation platform for digital marketing agencies. `backend/` is the FastAPI API (Python 3.12, PostgreSQL) and `frontend/` is the Next.js web app.

## Run it locally

1. Create `backend/.env` from `backend/.env.example` and fill in the database password and a `SECRET_KEY`.
2. Set up the database and a test login (from `backend/`):

   ```bash
   .venv/Scripts/alembic upgrade head
   .venv/Scripts/python -m scripts.seed_dev
   ```

   The test login is in `backend/scripts/seed_dev.py`. To add a real user, run `python -m scripts.create_user --help`.
3. Start the API (from `backend/`):

   ```bash
   .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
   ```

4. Start the web app (from `frontend/`), then open http://localhost:3000:

   ```bash
   npm run dev
   ```

The web app forwards every `/api` request to the API on port 8000, so both must be running.

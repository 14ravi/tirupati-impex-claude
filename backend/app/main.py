from fastapi import FastAPI

from app.routers import auth, dashboard

app = FastAPI(title="Lead platform API")
app.include_router(auth.router)
app.include_router(dashboard.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

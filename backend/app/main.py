from fastapi import FastAPI

from app.routers import auth, dashboard, workflows

app = FastAPI(title="Lead platform API")
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(workflows.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

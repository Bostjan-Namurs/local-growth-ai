from fastapi import FastAPI

from app.routes.blueprints import router as blueprints_router
from app.routes.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(title="LocalGrowth AI API", version="0.1.0")
    app.include_router(health_router)
    app.include_router(blueprints_router)
    return app


app = create_app()

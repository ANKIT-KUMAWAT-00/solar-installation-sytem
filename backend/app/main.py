from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import (
    auth, dashboard, crm, surveys, packages, quotations,
    orders, payments, inventory, serials, dispatch,
    technicians, installations, warranties, service,
    subsidies, finance, reports
)
from app.api.websockets import notifications_ws
from app.seed.seed_data import seed_erp_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Seed database with realistic demonstration data
    try:
        await seed_erp_database()
    except Exception as e:
        print(f"Seed note: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SunPower Solutions – Integrated Solar Installation Management System & Enterprise ERP",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(crm.router, prefix=settings.API_V1_STR)
app.include_router(surveys.router, prefix=settings.API_V1_STR)
app.include_router(packages.router, prefix=settings.API_V1_STR)
app.include_router(quotations.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(serials.router, prefix=settings.API_V1_STR)
app.include_router(dispatch.router, prefix=settings.API_V1_STR)
app.include_router(technicians.router, prefix=settings.API_V1_STR)
app.include_router(installations.router, prefix=settings.API_V1_STR)
app.include_router(warranties.router, prefix=settings.API_V1_STR)
app.include_router(service.router, prefix=settings.API_V1_STR)
app.include_router(subsidies.router, prefix=settings.API_V1_STR)
app.include_router(finance.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(notifications_ws.router)

@app.get("/")
async def root():
    return {
        "system": "SunPower Solutions – Solar Installation Management ERP",
        "version": "2.0.0",
        "status": "OPERATIONAL",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

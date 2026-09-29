from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.db.base  # Ensures all models are registered with Base
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup (works seamlessly for SQLite or PostgreSQL)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI Job Hunter Backend",
    version=settings.VERSION,
    description="Production-quality MVP helping job seekers discover jobs from public ATS APIs with zero unauthorized scraping.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware - permits any localhost / 127.0.0.1 port, custom origins, and *.vercel.app deployments
origins = [str(o).strip() for o in settings.BACKEND_CORS_ORIGINS if o != "*"]
for common_origin in [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]:
    if common_origin not in origins:
        origins.append(common_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^(https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:[0-9]+)?|https:\/\/.*\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

@app.get("/")
def root():
    return {"message": "Welcome to the AI Job Hunter Backend", "version": settings.VERSION}

# Health Check
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


# Include v1 API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

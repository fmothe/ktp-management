from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from database import engine, Base, SessionLocal
from models import User, Team, Player, Match, PlayerMatchStats
from auth import get_password_hash
from routes import auth, teams, players, matches, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    
    # Create default admin user if not exists
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin"),
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created (username: admin, password: admin)")
        
        # Create FREE AGENTS team if not exists
        free_agents = db.query(Team).filter(Team.is_free_agents == True).first()
        if not free_agents:
            free_agents_team = Team(
                name="FREE AGENTS",
                tag="FA",
                is_free_agents=True
            )
            db.add(free_agents_team)
            db.commit()
            print("FREE AGENTS team created")
    finally:
        db.close()
    
    yield
    # Shutdown
    pass

app = FastAPI(
    title="KTP League API",
    description="API for KTP League - Day of Defeat 1.3 competitive league management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Add any additional origins from environment variable
additional_origins = os.getenv("CORS_ORIGINS", "")
if additional_origins:
    origins.extend(additional_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(stats.router)

@app.get("/")
async def root():
    return {
        "message": "KTP League API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for deployment monitoring"""
    try:
        # Test database connection
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "api": "healthy"
    }

@app.get("/api/health")
async def api_health_check():
    """API health check endpoint"""
    return await health_check()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

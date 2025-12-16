# KTP League Management System

A full-stack web application for managing Day of Defeat 1.3 competitive league matches, teams, players, and statistics.

![Day of Defeat](https://img.shields.io/badge/Game-Day%20of%20Defeat%201.3-olive)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)
![React](https://img.shields.io/badge/Frontend-React-61DAFB)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791)
![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED)

## Features

### Team Management
- Create and manage teams with name and tag
- Maximum 10 players per team
- Special "FREE AGENTS" team with unlimited players
- View team roster and match history

### Player Management
- Register players with nicknames
- Assign players to teams
- Track overall statistics (kills, deaths, flags)
- View player match history

### Match System
- Three match types: **DRAFT**, **LEAGUE**, **SCRIM**
- Schedule future matches
- Load completed match results with full statistics
- 6v6 format with 2 halves per match
- Ringer support for SCRIM matches (stats don't count toward totals)

### Statistics & Leaderboards
- Player leaderboard sortable by K/D, kills, deaths, flags
- Most played maps
- Top performers dashboard
- Team win/loss records

### Admin Features
- User management (add/remove admins)
- JWT-based authentication
- Protected routes

## Tech Stack

- **Backend**: Python FastAPI + SQLAlchemy ORM
- **Frontend**: React + Vite + TailwindCSS
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with bcrypt
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ktp-league.git
   cd ktp-league
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

5. **Default admin credentials**
   - Username: `admin`
   - Password: `admin`
   
   ⚠️ **Change these immediately in production!**

## Development Setup

### Backend (without Docker)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/ktpleague"
export SECRET_KEY="your-secret-key"

# Run development server
uvicorn main:app --reload --port 8000
```

### Frontend (without Docker)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/users` | Create new user (admin only) |
| GET | `/api/auth/users` | List all users (admin only) |
| DELETE | `/api/auth/users/{id}` | Delete user (admin only) |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List all teams |
| POST | `/api/teams` | Create new team |
| GET | `/api/teams/{id}` | Get team details |
| PUT | `/api/teams/{id}` | Update team |
| DELETE | `/api/teams/{id}` | Delete team |
| POST | `/api/teams/{id}/players/{player_id}` | Add player to team |
| DELETE | `/api/teams/{id}/players/{player_id}` | Remove player from team |

### Players
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/players` | List all players |
| POST | `/api/players` | Create new player |
| GET | `/api/players/{id}` | Get player details |
| PUT | `/api/players/{id}` | Update player |
| DELETE | `/api/players/{id}` | Delete player |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | List all matches |
| POST | `/api/matches` | Schedule new match |
| POST | `/api/matches/load` | Load completed match with stats |
| GET | `/api/matches/{id}` | Get match details with player stats |
| GET | `/api/matches/upcoming` | Get upcoming scheduled matches |
| GET | `/api/matches/recent` | Get recently played matches |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/leaderboard` | Player leaderboard |
| GET | `/api/stats/dashboard` | Dashboard overview stats |
| GET | `/api/stats/maps` | Map play statistics |
| GET | `/api/stats/team/{id}` | Team statistics |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Application health check |
| GET | `/api/health` | API health check |

## Database Schema

```
users
├── id (PK)
├── username (unique)
├── password_hash
└── is_admin

teams
├── id (PK)
├── name (unique)
├── tag (unique)
└── is_free_agents

players
├── id (PK)
├── nickname (unique)
├── team_id (FK -> teams)
├── total_kills
├── total_deaths
├── total_flags
└── matches_played

matches
├── id (PK)
├── match_type (DRAFT/LEAGUE/SCRIM)
├── team1_id (FK -> teams)
├── team2_id (FK -> teams)
├── team1_score
├── team2_score
├── map_name
├── scheduled_date
├── played_date
└── created_at

player_match_stats
├── id (PK)
├── match_id (FK -> matches)
├── player_id (FK -> players)
├── team_id (FK -> teams)
├── half (1 or 2)
├── kills
├── deaths
├── flags
└── is_ringer
```

## GCP Deployment

### Using Cloud Run

1. **Build and push images**
   ```bash
   # Backend
   cd backend
   gcloud builds submit --tag gcr.io/PROJECT_ID/ktp-league-backend
   
   # Frontend
   cd ../frontend
   gcloud builds submit --tag gcr.io/PROJECT_ID/ktp-league-frontend
   ```

2. **Deploy to Cloud Run**
   ```bash
   # Deploy backend
   gcloud run deploy ktp-league-backend \
     --image gcr.io/PROJECT_ID/ktp-league-backend \
     --platform managed \
     --region us-central1 \
     --set-env-vars DATABASE_URL=your_db_url,SECRET_KEY=your_secret
   
   # Deploy frontend
   gcloud run deploy ktp-league-frontend \
     --image gcr.io/PROJECT_ID/ktp-league-frontend \
     --platform managed \
     --region us-central1
   ```

### Using Cloud SQL for PostgreSQL

1. Create a Cloud SQL PostgreSQL instance
2. Update `DATABASE_URL` environment variable with Cloud SQL connection string
3. Configure Cloud SQL Proxy if needed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is for the KTP League community.

---

**🎮 Good luck and have fun! 🏆**

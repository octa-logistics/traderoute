# TradeRoute

Inventory and sales management platform for logistics operations. Python/FastAPI backend with a lightweight React SPA frontend.

## Architecture

```
┌─────────────────┐     ┌──────────────────────────┐     ┌────────────┐
│  React SPA      │────▶│  FastAPI Backend          │────▶│ PostgreSQL │
│  (Vite + React) │     │  (All business logic)     │     │            │
│  Nginx served   │     │  Python 3.12+             │     │            │
└─────────────────┘     └──────────────────────────┘     └────────────┘
```

- **Backend** owns all business logic, validation, and data access
- **Frontend** is presentation-only — no business logic, purely consumes the API
- **API-first** design enables headless/integration use cases
- **JWT auth** with multi-tenant org scoping

## Quick Start (Docker Compose)

```bash
# Start all services (PostgreSQL + FastAPI + React SPA)
docker compose up -d

# App available at http://localhost:3000
# API available at http://localhost:8000/docs (Swagger UI)
```

## Local Development

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Start PostgreSQL
docker compose up -d db

# Run backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

Open http://localhost:5173 for the dev frontend.

### Running Tests

```bash
cd backend
pip install -e ".[dev]" aiosqlite
PYTHONPATH=. pytest tests/ -v
```

Tests use an in-memory SQLite database — no external services required.

## Project Structure

```
backend/
  app/
    core/           # Config, database, auth, security
    models/         # SQLAlchemy ORM models
    schemas/        # Pydantic request/response schemas
    routers/        # API endpoint handlers
    services/       # Business logic (cost calculator, sales, dashboard)
  alembic/          # Database migrations
  tests/            # Pytest test suite
frontend/
  src/
    pages/          # React page components
    components/     # Shared UI components
    lib/            # API client, auth context, types
docker-compose.yml  # Full stack orchestration
```

## API Endpoints

All endpoints are under `/api/v1/` and require JWT authentication.

| Resource          | List/Create                      | Get/Update/Delete                       |
|-------------------|----------------------------------|-----------------------------------------|
| Auth              | POST /api/v1/auth/login          | GET /api/v1/auth/me                     |
| Vendors           | GET/POST /api/v1/vendors         | GET/PATCH/DELETE /api/v1/vendors/:id    |
| Customers         | GET/POST /api/v1/customers       | GET/PATCH/DELETE /api/v1/customers/:id  |
| Categories        | GET/POST /api/v1/categories      | GET/PATCH/DELETE /api/v1/categories/:id |
| Storage Locations | GET/POST /api/v1/storage-locations | GET/PATCH/DELETE /api/v1/storage-locations/:id |
| Purchase Deals    | GET/POST /api/v1/purchase-deals  | GET/PATCH/DELETE /api/v1/purchase-deals/:id |
| Items             | GET/POST /api/v1/items           | GET/PATCH/DELETE /api/v1/items/:id      |
| Processing Logs   | GET/POST /api/v1/items/:id/processing-logs | —                              |
| Sales             | GET/POST /api/v1/sales           | GET/PATCH/DELETE /api/v1/sales/:id      |
| Dashboard         | GET /api/v1/dashboard/stats      | —                                       |
| Health            | GET /api/v1/health               | —                                       |

Items list supports filtering: `?status=LISTED&categoryId=...&purchaseDealId=...`

## Key Business Logic

- **Cost Calculator**: Computes total item costs including allocated purchase cost, fees, processing costs, and daily financing interest accrual
- **Sale Lifecycle**: Atomic sale creation marks items as SOLD; sale deletion resets items to LISTED
- **Dashboard Stats**: Aggregated inventory value, sold revenue, margins, and top categories by margin

# OctaShip

Logistics management platform built with Next.js 14, Prisma, and Tailwind CSS.

## Local Setup

### Prerequisites

- Node.js 20+
- npm

### Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL via Docker Compose
docker compose up -d db

# Run database migration
npx prisma migrate dev

# Seed sample data
npx prisma db seed

# Start dev server
npm run dev
```

Open http://localhost:3000/dashboard to see the app.

### Docker Compose (full stack)

```bash
# Start PostgreSQL + app
docker compose up -d

# Run migrations against the Postgres container
npx prisma migrate deploy
```

App available at http://localhost:3000.

## Project Structure

```
src/
  app/
    api/          # REST API routes (warehouses, products, inventory, orders, shipments)
    dashboard/    # Dashboard UI pages
  components/     # Shared React components
  generated/      # Prisma generated client
  lib/            # Utilities (prisma client singleton)
prisma/
  schema.prisma   # Database schema
  seed.ts         # Sample data seeder
  migrations/     # Database migrations
```

## API Endpoints

| Resource   | List/Create         | Get/Update              |
|------------|---------------------|-------------------------|
| Warehouses | GET/POST /api/warehouses | GET/PATCH /api/warehouses/:id |
| Products   | GET/POST /api/products   | GET/PATCH /api/products/:id   |
| Inventory  | GET/POST /api/inventory  | GET/PATCH /api/inventory/:id  |
| Orders     | GET/POST /api/orders     | GET/PATCH /api/orders/:id     |
| Shipments  | GET/POST /api/shipments  | GET/PATCH /api/shipments/:id  |

All list endpoints support `?page=1&limit=20` pagination.

# Cloud POS – Backend Service

Standalone Express.js REST API and MongoDB service for Cloud POS.

## Features
- **Orders API**: Create and retrieve customer orders with date and waiter filtering (`/api/orders`).
- **Waiters API**: Register staff, track real-time shift performance and leaderboard stats (`/api/waiters`).
- **Reports API**: Comprehensive daily profit and loss, sales by payment channel, and item consumption (`/api/reports/today`).
- **Status API**: MongoDB connectivity diagnostic with seamless local memory fallback (`/api/status`).
- **CORS enabled**: Ready for Next.js frontend, mobile apps, or local testing.

## Folder Structure
```
backend/
├── src/
│   ├── config/
│   │   └── db.ts                 # MongoDB client & fallback logic
│   ├── models/
│   │   └── types.ts              # TypeScript data interfaces
│   ├── services/
│   │   └── dbService.ts          # Business logic for orders & staff
│   ├── controllers/
│   │   ├── ordersController.ts   # Order endpoints handlers
│   │   ├── waitersController.ts  # Waiter performance handlers
│   │   ├── reportsController.ts  # Daily analytics handlers
│   │   └── statusController.ts   # Health & DB diagnostic handlers
│   ├── routes/
│   │   ├── ordersRoutes.ts
│   │   ├── waitersRoutes.ts
│   │   ├── reportsRoutes.ts
│   │   ├── statusRoutes.ts
│   │   └── index.ts              # Router aggregator (/api/...)
│   └── server.ts                 # Express app initialization
├── .env.example
├── .env
├── package.json
└── tsconfig.json
```

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Configure `.env`:
   ```env
   PORT=5000
   MONGODB_URI=
   MONGODB_DB=restaurant_pos
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The API will be available at [http://localhost:5000/api](http://localhost:5000/api).

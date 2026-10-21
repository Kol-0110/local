# Cloud POS & Waiter OS – Full-Stack Project

This project is organized into two completely separate folders for maximum readability, clean architecture, and modularity:

```
poscloud/
├── frontend/               # Next.js 15 Client App (Pages, UI, POS, KDS, Tables, i18n)
│   ├── src/
│   │   ├── app/            # App Router pages (/pos, /kds, /tables, /waiter, /menu, /receipts)
│   │   ├── components/     # Reusable UI components (Header, Modals, Providers)
│   │   ├── i18n/           # English, Amharic, and Afaan Oromoo translations
│   │   └── lib/            # Client state store (store.ts) and API client (api.ts)
│   ├── .env.local          # Frontend environment variables (API URL, Restaurant Name)
│   ├── package.json        # Frontend dependencies
│   └── README.md
│
├── backend/                # Standalone Express.js REST API & MongoDB Service
│   ├── src/
│   │   ├── config/         # MongoDB Atlas connection & fallback config
│   │   ├── controllers/    # Route controllers (orders, waiters, reports, status)
│   │   ├── models/         # TypeScript data contracts & models
│   │   ├── routes/         # Express router endpoints
│   │   ├── services/       # Database & fallback memory services
│   │   └── server.ts       # Express server entry point
│   ├── .env                # Backend environment variables (PORT, MONGODB_URI)
│   ├── package.json        # Backend dependencies
│   └── README.md
│
├── package.json            # Root workspace scripts to run both servers concurrently
└── README.md
```

---

## Quick Start (Run Both Servers Simultaneously)

From this root folder:

```bash
# 1. Run both Frontend (port 3000) and Backend (port 5000) together:
npm run dev
```

---

## Running Individually

### Running the Frontend
```bash
cd frontend
npm run dev
```
Accessible at: [http://localhost:3000](http://localhost:3000)

### Running the Backend
```bash
cd backend
npm run dev
```
API endpoints at: [http://localhost:5000/api](http://localhost:5000/api)
- `GET  /api/status` – Connectivity diagnostics
- `GET  /api/orders` – List orders (with date & waiter filter)
- `POST /api/orders` – Save/sync order
- `GET  /api/waiters` – Staff performance & leaderboard
- `POST /api/waiters` – Register waiter
- `GET  /api/reports/today` – Daily financial analytics & consumption report

---

## Environment Variables

### Backend (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/restaurant_pos?retryWrites=true&w=majority
MONGODB_DB=restaurant_pos
CORS_ORIGIN=http://localhost:3000
```
*(If `MONGODB_URI` is left blank, the backend automatically runs in offline-safe in-memory fallback mode!)*

### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RESTAURANT_NAME="BGS Restaurant & Lounge"
```

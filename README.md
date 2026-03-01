# That's So Clever - Online Board Game

A real-time multiplayer web implementation of the dice game "That's So Clever" (Ganz Schön Clever).

## Setup

```bash
npm install
```

## Development

Run both frontend and backend:

```bash
npm run dev
```

Or run separately:
- Frontend: `cd frontend && npm run dev` (http://localhost:5173)
- Backend: `cd backend && npm run dev` (http://localhost:3001)

## Environment Variables

**Frontend** (create `frontend/.env` or `frontend/.env.local`):
- `VITE_WS_URL` - WebSocket URL (default: same origin for dev with Vite proxy)

**Backend**:
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Frontend origin for CORS (default: http://localhost:5173)

## Deployment (free tier)

The CI workflow deploys when tests pass on `main`:

- **Frontend**: GitHub Pages (Settings > Pages > Source: GitHub Actions)
- **Backend**: Render free tier (add `RENDER_DEPLOY_HOOK` secret from Render Dashboard)

Set `VITE_WS_URL` (repo variable) to your Render backend URL so the frontend connects to it.

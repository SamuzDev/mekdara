# Deployment Guide

Mekdara deploys as two separate Vercel projects: **frontend** (React/Vite) and **backend** (Elysia/Bun).

## Prerequisites

- [Bun](https://bun.sh) v1.4.x installed
- [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`)
- A [Neon](https://neon.tech) PostgreSQL database
- A GitHub OAuth App (for GitHub sign-in)

## 1. Clone and Install

```bash
git clone https://github.com/SamuzDev/mekdara.git
cd mekdara
bun install
```

## 2. Backend Setup

### Create Neon Database

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=verify-full`)

### Create GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set **Authorization callback URL** to `http://localhost:8080/api/auth/callback/github`
4. Copy the Client ID and Client Secret

### Configure Backend

Create `backend/.env`:

```env
PORT=8080
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=verify-full
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:8080
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Run Locally

```bash
cd backend
bun run dev
```

The backend runs at `http://localhost:8080`.

## 3. Frontend Setup

Create `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Run Locally

```bash
cd frontend
bun run dev
```

The frontend runs at `http://localhost:5173`.

## 4. Deploy to Vercel

### Deploy Backend

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Project Name**: `mekdara-api`
4. **Root Directory**: `backend`
5. **Framework**: Elysia (auto-detected)
6. **Install Command**: `cp ../bun.lock . 2>/dev/null; bun install`
7. **Build Command**: `bun build ./server.ts --outdir ./dist --target bun`
8. **Output Directory**: `dist`
9. Click **Deploy**

### Backend Environment Variables

Add these in the Vercel dashboard (Settings > Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://...` |
| `BETTER_AUTH_SECRET` | Random secret for session signing | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Your backend URL | `https://mekdara-api.vercel.app` |
| `CORS_ORIGIN` | Frontend URL | `https://mekdara-frontend.vercel.app` |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | `Ov23li...` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | `your_secret` |

### Deploy Frontend

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Project Name**: `mekdara-frontend`
4. **Root Directory**: `frontend`
5. **Framework**: Vite (auto-detected)
6. Click **Deploy**

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://mekdara-api.vercel.app` |

## 5. Post-Deploy

### Update GitHub OAuth Callback URL

After deploying, update your GitHub OAuth App's callback URL:

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Edit your OAuth App
3. Update **Authorization callback URL** to `https://mekdara-api.vercel.app/api/auth/callback/github`

### Update CORS_ORIGIN

Update the backend's `CORS_ORIGIN` environment variable in Vercel to match your frontend URL:

```
https://mekdara-frontend.vercel.app
```

## Project Structure

```
mekdara/
├── frontend/          → Vercel project "mekdara-frontend"
│   ├── vercel.json
│   ├── package.json
│   └── src/
├── backend/           → Vercel project "mekdara-api"
│   ├── vercel.json
│   ├── package.json
│   └── src/
└── docs/
```

## Troubleshooting

### Build fails with "Unknown lockfile version"

The backend copies the root `bun.lock` during install. Make sure you're using Bun 1.4.x locally:

```bash
bun --version  # should show 1.4.x
```

### CORS errors after deploy

Update the backend's `CORS_ORIGIN` environment variable to include your frontend URL.

### Auth callback redirect fails

Make sure `BETTER_AUTH_URL` matches your backend's production URL exactly (no trailing slash).

# Windows Explorer Clone (Bun Monorepo)

Windows Explorer-like web app with a Vue 3 frontend and a Bun + Elysia backend.
The left panel renders a custom folder tree, and the right panel shows direct
children (folders + files) for the selected folder.

## Features
- Custom folder tree (no tree library) with expand/collapse.
- Right panel shows direct subfolders and files.
- CRUD for folders and files.
- Search with scope (All/Folders/Files) and pagination.
- Root only vs All folders toggle for scalability vs spec demo.
- Service/repository layering, caching, and database indexes.

## Tech Stack
- Backend: Bun, Elysia, Prisma, PostgreSQL
- Frontend: Vue 3 (Composition API), Vite, Tailwind CSS, PrimeVue

## Prerequisites
- Bun v1.3+
- PostgreSQL (local or Docker)

## Installation
1) Install dependencies:
```bash
bun install
```

2) Configure database:
- Copy `backend/.env.example` to `backend/.env`
- Set `DATABASE_URL`

Option A: Docker
```bash
docker compose up -d
```

Option B: Local Postgres
- Ensure Postgres is running and the database exists.
- Update `DATABASE_URL` in `backend/.env`.

3) Prisma setup:
```bash
cd backend
bun run prisma:generate
bun run prisma:migrate
bun run seed
```

## Run (Dev)
```bash
bun run dev:backend
bun run dev:frontend
```
Open `http://localhost:5173`.

## Tests
Frontend:
```bash
cd frontend
bun run test -- --run
```

Backend:
```bash
cd backend
bun run test
```

## API Quick Notes
- `GET /api/v1/folders` returns full tree data (All folders mode).
- `GET /api/v1/folders/roots` returns root only (Root only mode).
- `GET /api/v1/folders/:id/children` returns direct children for right panel.
- CRUD: `/api/v1/folders`, `/api/v1/files`
- Search: `GET /api/v1/search?q=...&scope=all|folders|files&match=prefix|contains`
- Pagination: `limit` + `offset`

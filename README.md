# Smile API

REST API built with **NestJS 11**, **TypeScript**, and **MongoDB**. Authentication (JWT + refresh tokens), DDD-style modules, and OpenAPI docs. Optimized for development with **Cursor** and **Claude**.

---

## Cursor & Claude

This repo is set up for AI-assisted development in [Cursor](https://cursor.com) with [Claude](https://claude.ai):

- **`CLAUDE.md`** — Project rules, architecture, DDD conventions, and examples. Cursor/Claude use it as context so suggestions stay consistent with the codebase.
- **DDD layout** — Clear module boundaries (auth, user) and layer structure so AI can navigate and suggest changes in the right place.
- **Conventions** — Single use-case per action, abstract repositories, Swagger on DTOs; all documented so generated code fits the project.

If you use Cursor with Claude, open `CLAUDE.md` for full guidance.

---

## Stack

| Layer        | Tech |
|-------------|------|
| Runtime     | Node.js, NestJS 11, Express |
| Language    | TypeScript 5.7 (strict) |
| Database    | MongoDB (Mongoose) |
| Auth        | JWT (access + refresh), Passport |
| Validation  | class-validator, Zod (env) |
| Docs        | Swagger/OpenAPI @ `/api` |

---

## Quick start

**Requirements:** Node.js 18+, MongoDB (local or Atlas).

```bash
git clone https://github.com/YOUR_USERNAME/smile-api.git
cd smile-api
cp .env.example .env
```

Edit `.env`: set `MONGODB_URI` and `JWT_SECRET` (min 32 chars).

```bash
npm install
npm run start:dev
```

API: **http://localhost:3000**  
Swagger: **http://localhost:3000/api**

---

## Environment

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (e.g. `mongodb://localhost:27017/smile-api` or Atlas `mongodb+srv://...`) |
| `JWT_SECRET` | Secret for signing tokens (min 32 characters) |
| `JWT_ACCESS_EXPIRATION` | Access token TTL (default `15m`) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL (default `7d`) |
| `PORT` | Server port (default `3000`) |

---

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register and get tokens |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | No | Revoke refresh token |
| GET | `/users/me` | JWT | Current user profile |

Full request/response schemas: **http://localhost:3000/api** (Swagger).

---

## Project structure

```
src/
├── common/           # Shared: guards, decorators, filters, env schema
├── modules/
│   ├── auth/         # Register, login, refresh, logout
│   └── user/         # Profile (e.g. GET /users/me)
├── app.module.ts
└── main.ts
```

Each module follows a DDD-style layout: `domain/`, `application/use-cases/`, `infrastructure/`, `presentation/`. See **CLAUDE.md** for the full layout and conventions.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Run with watch mode |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run test:e2e` | E2E tests |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

## License

UNLICENSED (private). See [LICENSE](LICENSE) if present.

# Talent-Pool Backend

This repository contains the backend for the Talent-Pool / Shikhi project: a TypeScript Node.js API that provides authentication, course management, lessons, enrollments, payments, and related services used by the front-end application.

Key features

- Authentication (JWT, cookies)
- Course, lesson and category management
- Enrollment and lesson progress tracking
- Payment integration (Stripe)
- File uploads (Cloudinary)

Tech stack

- Node.js + TypeScript
- Express (or similar HTTP framework)
- Prisma ORM (Postgres) for database
- Jest for tests
- pnpm / npm for package management

Repository layout (top-level)

- `src/` — application source code (routes, modules, utils, config)
- `prisma/` — Prisma schema and migrations
- `tests/` — unit/integration tests
- `README.md` — this file

Environment and local setup for test

1. Install dependencies:

 pnpm install


create a .env.test file for test env . this way the actual db and the test db stays separate.


   (or use `npm install` / `yarn` as preferred)

1. Create environment files:
   - Copy your normal environment file to create a test-specific environment file:

     cp .env.example .env.test

   - Edit `.env.test` and set values appropriate for testing. Important items typically include:
     - `DATABASE_URL` — point this to a test database (separate from production/dev)
     - `JWT_SECRET`, `STRIPE_*` and any other credentials used by the app

2. Run database migrations (against the test database):

   NODE_ENV=test npx prisma migrate deploy

   or, for development-style migrations on a local test database:

   NODE_ENV=test npx prisma migrate reset --force

Running tests (important)
All test commands must be run with `NODE_ENV=test` prefixed. Examples:

- Run the test script from package.json:

  NODE_ENV=test pnpm test

- Run Jest directly (single-threaded run recommended for DB tests):

  NODE_ENV=test pnpm jest --runInBand

- npm alternative:

  NODE_ENV=test npm run test

Notes and recommendations

- Use a dedicated test database to avoid data loss. For CI, wire `DATABASE_URL` to the CI-provided ephemeral database.
- Keep `.env.test` out of source control — store secrets in your CI environment variables.
- If tests seed data, ensure the seed script targets the test DB when `NODE_ENV=test` is set.

Where to find this file

- This README is at [backend/README.md](backend/README.md)

If you'd like, I can also:

- Add a sample `.env.test.example` with common keys to make test setup faster
- Run the test suite here (requires the test DB to be reachable from this environment)

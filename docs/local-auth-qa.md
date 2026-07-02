# Local Auth QA Setup

This setup gives you a repeatable local environment to exercise auth across the
web surfaces:

- job seeker
- company
- campus
  (these three are served by the `halajob-website` repo)
- admin
  (served by the `halajob-admin` repo)

It is meant for local development only.

> Repo layout note: HalaJob was split out of the retired `halajobe` monorepo.
> The backend is this repo (`halajob-backend`); the public site and the admin
> console are the sibling repos `halajob-website` and `halajob-admin`. Clone the
> repos you need side by side. Commands below say which repo to run them in.

## 1. Make sure MongoDB is available

You need a MongoDB database before the backend can start.

- If MongoDB is installed on your machine, the default local connection string below should work.
- If you use MongoDB Atlas instead, replace the `CONNECTION_URL` value with your Atlas connection string.

## 2. Create the backend env file

In the **`halajob-backend`** repo root, create a file named `.env.local`:

```text
NODE_ENV=development
PORT=3000
CONNECTION_URL=mongodb://127.0.0.1:27017/halajob_local
JWT_SECRET=hala-job-local-only-secret
PUBLIC_BASE_URL=http://127.0.0.1:5173
SEED_ADMIN_ALLOW_CREATE=true
SEED_ADMIN_EMAIL=admin@halajob.local
SEED_ADMIN_PASSWORD=HalaDev123!
SEED_ADMIN_FIRST_NAME=Local
SEED_ADMIN_LAST_NAME=Admin
SEED_ADMIN_PHONE_E164=+10000000000
SEED_EMPLOYEE_PASSWORD=HalaDev123!
SEED_COMPANY_PASSWORD=HalaDev123!
```

The backend loads `.env.local`, so you do not need to rename this file to `.env`.
`SEED_ADMIN_ALLOW_CREATE=true` is required for the seeder to create the local
admin (see `docs/DEPLOYMENT.md` → First Admin Procedure).

## 3. Create the frontend env file

In the **`halajob-website`** repo root, create a file named `.env.local`:

```text
VITE_API_URL=http://127.0.0.1:3000
VITE_ENABLE_UNIVERSITY_PREVIEW=true
```

`VITE_ENABLE_UNIVERSITY_PREVIEW=true` keeps the university dashboard visible for
review even before private campus backend records are ready.

If you also want to test the admin console, create the same `.env.local`
(`VITE_API_URL=http://127.0.0.1:3000`) in the **`halajob-admin`** repo root.

## 4. Install backend packages

In the **`halajob-backend`** repo, run:

```bash
npm ci
```

## 5. Seed the database

Still in **`halajob-backend`**, run:

```bash
npm run seed
```

If seeding works, you should see the seeders complete without `CONNECTION_URL` or `JWT_SECRET` errors.

## 6. Start the backend

Still in **`halajob-backend`**, run:

```bash
npm run dev
```

Leave that terminal running.

## 7. Start the frontend

Open a second terminal in the **`halajob-website`** repo and run:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. If it does not show a URL, try:

```text
http://127.0.0.1:5173
```

For the admin console, run the same `npm ci && npm run dev` in the
**`halajob-admin`** repo (it serves on its own Vite port, e.g.
`http://127.0.0.1:5174`).

## 8. Test accounts created by the seeders

Use these logins after `npm run seed` completes:

- Admin
  - email: `admin@halajob.local`
  - password: `HalaDev123!`
- Job seekers
  - emails: `employee1@gmail.com` through `employee10@gmail.com`
  - password for all seeded job seekers: `HalaDev123!`
- Companies
  - emails: `company1@gmail.com` through `company5@gmail.com`
  - password for all seeded companies: `HalaDev123!`

## 9. Campus notes

- Student campus users can be created from the campus registration flow in the UI.
- University preview is front-end only until the private campus backend records exist.
- Posting university opportunities and loading private university records still depend on the campus endpoints being available in the backend.

## 10. Quick failure checks

If the backend says `Missing required environment variables: CONNECTION_URL, JWT_SECRET`, check:

- the file is named `.env.local`
- the file is in the `halajob-backend` repo root
- you restarted the backend after creating the file

If the frontend loads but buttons do not fetch data, check:

- the backend terminal is still running
- `VITE_API_URL` points to `http://127.0.0.1:3000`
- the database was seeded before you tried to log in

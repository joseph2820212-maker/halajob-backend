# Local Auth QA Setup

This setup gives you a repeatable local environment for the four web surfaces:

- job seeker
- company
- admin
- campus

It is meant for local development only.

## 1. Make sure MongoDB is available

You need a MongoDB database before the backend can start.

- If MongoDB is installed on your machine, the default local connection string below should work.
- If you use MongoDB Atlas instead, replace the `CONNECTION_URL` value with your Atlas connection string.

## 2. Create the backend env file

Create a file named `.env.local` in the backend root:

`work/halajobe/.env.local`

Paste this:

```text
NODE_ENV=development
PORT=3000
CONNECTION_URL=mongodb://127.0.0.1:27017/halajobe_local
JWT_SECRET=hala-job-local-only-secret
PUBLIC_BASE_URL=http://127.0.0.1:5173
SEED_ADMIN_EMAIL=admin@halajobe.local
SEED_ADMIN_PASSWORD=HalaDev123!
SEED_ADMIN_FIRST_NAME=Local
SEED_ADMIN_LAST_NAME=Admin
SEED_ADMIN_PHONE=+10000000000
SEED_EMPLOYEE_PASSWORD=HalaDev123!
SEED_COMPANY_PASSWORD=HalaDev123!
```

The backend now loads `.env.local`, so you do not need to rename this file to `.env`.

## 3. Create the frontend env file

Create a file named `.env.local` in the web app:

`work/halajobe/web/.env.local`

Paste this:

```text
VITE_API_URL=http://127.0.0.1:3000
VITE_ENABLE_UNIVERSITY_PREVIEW=true
```

`VITE_ENABLE_UNIVERSITY_PREVIEW=true` keeps the university dashboard visible for review even before private campus backend records are ready.

## 4. Install backend packages

Open a terminal in `work/halajobe` and run:

```bash
npm ci
```

## 5. Seed the database

Still in `work/halajobe`, run:

```bash
npm run seed
```

If seeding works, you should see the seeders complete without `CONNECTION_URL` or `JWT_SECRET` errors.

## 6. Start the backend

Still in `work/halajobe`, run:

```bash
npm run dev
```

Leave that terminal running.

## 7. Start the frontend

Open a second terminal in `work/halajobe/web` and run:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. If it does not show a URL, try:

```text
http://127.0.0.1:5173
```

## 8. Test accounts created by the seeders

Use these logins after `npm run seed` completes:

- Admin
  - email: `admin@halajobe.local`
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
- the file is in `work/halajobe`
- you restarted the backend after creating the file

If the frontend loads but buttons do not fetch data, check:

- the backend terminal is still running
- `VITE_API_URL` points to `http://127.0.0.1:3000`
- the database was seeded before you tried to log in

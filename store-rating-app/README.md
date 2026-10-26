# Store Rating Web Application

A full-stack web app where users rate stores from 1 to 5.
One login works for three roles: **System Administrator**, **Normal User** and **Store Owner**.

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, React Router, Axios, Three.js (3D scenes), lucide-react icons, plain CSS design system with light/dark theme |
| Backend | Node.js + Express 4 |
| Database | PostgreSQL + Prisma ORM (migrations included) |
| Security | JWT, bcrypt, Helmet, CORS allow-list, rate limiting, zod validation |

---

## 1. What is in this project

```
store-rating-app/
├── client/                 React frontend (Vite)
│   ├── src/components/     Topbar, Scene (3D), Charts, StoreTile, StoreBrowser, DataTable, RatingInput, dialogs...
│   ├── src/three/          city.js (Three.js shop-city and owner shop scenes), colors.js
│   ├── src/pages/          Login, Register, admin/*, user/*, owner/*, ChangePassword, AccessDenied, NotFound
│   ├── src/layouts/        AuthLayout, DashboardLayout
│   ├── src/context/        AuthContext (login state), ToastContext (notifications)
│   ├── src/hooks/          useForm, useListQuery (search/sort/pagination), useDebounce
│   ├── src/services/       Axios API wrappers
│   ├── src/routes/         ProtectedRoute (role guard), AppRoutes
│   └── src/utils/          validators (same rules as the server), constants, formatters
├── server/
│   ├── prisma/             schema.prisma, migrations/, seed.js (first admin), seed-demo.js (sample data)
│   ├── src/                config, routes, controllers, services, middleware, validators, utils
│   ├── tests/              Automated tests (Jest + Supertest, real PostgreSQL)
│   └── server.js
├── README.md
└── .gitignore
```

### Database design

```
users (id, name, email UNIQUE, password_hash, address, role, created_at, updated_at)
   │ 1                                   │ 1
   │ owns (0..1 store per OWNER)         │ gives
   ▼ 0..1                                ▼ 0..*
stores (id, name, email UNIQUE,   ratings (id, user_id, store_id, rating 1..5, created_at, updated_at)
        address, owner_id UNIQUE,         UNIQUE (user_id, store_id)   <- one rating per user per store
        created_at, updated_at)  1 ──── 0..*  (store_id)
```

Rules enforced **inside PostgreSQL** (not just in code):
unique emails, one rating per user per store, `rating BETWEEN 1 AND 5`, name length 20-60,
address length <= 400, foreign keys (ratings are deleted with their user/store, a deleted owner
leaves the store unassigned), and a trigger that only lets a user with role `OWNER` own a store.
Average ratings are never stored; they are calculated from the `ratings` table on every request.

---

## 2. Setup for beginners (Windows PowerShell)

> The commands below are for Windows. They also work on macOS/Linux with small changes (e.g. `cp` instead of `copy`).

### Step 1: Install the software
1. **Node.js 20 or newer (LTS)**: https://nodejs.org . After installing, open a new PowerShell and check:
   ```powershell
   node -v
   npm -v
   ```
2. **PostgreSQL 14 or newer**: https://www.postgresql.org/download/windows/ .
   During the install, remember the password you give to the `postgres` user and keep port `5432`.
3. **VS Code** (optional but recommended): https://code.visualstudio.com/

### Step 2: Create the database
Open PowerShell and run `psql` (if it is not found, open "SQL Shell (psql)" from the Start menu instead):
```powershell
psql -U postgres
```
Enter your `postgres` password, then paste these lines. **Change `choose_a_password` to your own password.**
```sql
CREATE USER storeapp WITH PASSWORD 'choose_a_password' CREATEDB;
CREATE DATABASE store_rating OWNER storeapp;
CREATE DATABASE store_rating_test OWNER storeapp;
\q
```
(`store_rating_test` is only used by the automated tests. The tests empty it, so never point it at real data.)

### Step 3: Open the project in VS Code
```powershell
cd path\to\store-rating-app
code .
```
Use the VS Code terminal (Terminal > New Terminal) for the next steps.

### Step 4: Backend: install and configure
Run these from the **`store-rating-app\server`** folder:
```powershell
cd server
npm install
copy .env.example .env
```
Open `server\.env` and edit:
- `DATABASE_URL` and `TEST_DATABASE_URL`: put your database password in place of `CHANGE_ME`.
- `JWT_SECRET`: create a long random value with
  ```powershell
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
  and paste the output.
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_ADDRESS`, `ADMIN_PASSWORD`: the first administrator.
  Name up to 60 characters; password 8-16 characters with one uppercase letter and one special character.

### Step 5: Create the tables (Prisma migrations) and the first administrator
Still in **`store-rating-app\server`**:
```powershell
npx prisma migrate deploy
npm run seed
```
`migrate deploy` creates all tables and constraints. `seed` creates the administrator from your `.env` values
(there are no built-in credentials in the source code).

*Optional sample data* (60 member accounts, 30 of them owning a store, and about 850 ratings spread over the last 30 days,
so the dashboards, charts and the 3D neighbourhood look full): set `DEMO_PASSWORD` in `.env`, then run
`npm run seed:demo`. Demo logins: `user1@demo.example` ... `user60@demo.example`, all with your `DEMO_PASSWORD`.
`user1`-`user30` already own a store (they see both sides); `user31`-`user60` can open one from **My store**.
Running it again replaces the old demo data (only `@demo.example` accounts are touched). Development databases only.

### Step 6: Start the backend
In **`store-rating-app\server`**:
```powershell
npm run dev
```
You should see `Store Rating API running on http://localhost:5000`.
Check it in a browser: http://localhost:5000/api/health

### Step 7: Frontend: install and start
Open a **second** terminal, in **`store-rating-app\client`**:
```powershell
cd client
npm install
copy .env.example .env
npm run dev
```

### Step 8: Open the app
Go to **http://localhost:5173** in your browser.

---

## 3. How to try each role

There is **one login page for everyone**. What you see depends on the account:

1. **System Administrator**: log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.
   - Overview: a 3D skyline of the best rated stores (hover a building), totals, a 14-day ratings chart,
     the score distribution, top stores and the latest ratings.
   - *Add user*, *Add store* (pick any member account without a store; it becomes the Store Owner),
     *Users* / *Stores* with filters and sortable columns, user details.
2. **Normal User and Store Owner share one account experience.** Every member sees three tabs with the same login:
   - **Browse stores**: search/sort (grid or list view), **Rate** 1-5 stars, **Modify rating**.
   - **My ratings**: the stores you have rated.
   - **My store**: if you have no store yet, the page offers **Open my store** (name, email, address).
     After that the same tab shows your store in 3D, its average, the breakdown and everyone who rated it.
     Opening a store turns a Normal User into a Store Owner; nothing else changes for them.
   - You cannot rate your own store (it is marked **Your store** in the list).
3. Everyone can **Change password** and **Log out** from the account menu (top right), and switch light/dark theme.

---

## 4. Running the automated tests
In **`store-rating-app\server`** (needs `TEST_DATABASE_URL` in `.env`):
```powershell
npm test
```
There are 63 backend tests against a real PostgreSQL database covering registration, login, validation limits,
duplicate emails, expired tokens, role access, admin user/store creation, dashboard counts, filtering and sorting,
rating create/update/average, "no duplicate rating", "cannot touch another user's rating",
owner data isolation, SQL-injection style input, CORS and database-level constraints.

---

## 5. API summary

All responses use `{ "success": true|false, "data": ..., "meta": ..., "message": ..., "errors": { field: message } }`.
Send `Authorization: Bearer <token>` on protected routes.

| Method & path | Role | Purpose |
|---|---|---|
| POST `/api/auth/register` | public | Normal user sign-up (role always `USER`) |
| POST `/api/auth/login` | public | Login, returns token and user |
| GET `/api/auth/me` | any | Current user |
| PATCH `/api/auth/change-password` | any | Change password |
| GET `/api/admin/dashboard` | ADMIN | Totals of users, stores, ratings |
| POST / GET `/api/admin/users` | ADMIN | Create user / list (filter `name,email,address,role`; `sortBy`, `order`, `page`, `limit`) |
| GET `/api/admin/users/:id` | ADMIN | User details (owners include store average rating) |
| POST / GET `/api/admin/stores` | ADMIN | Create store / list (filter `name,email,address`, `search`, sort incl. `rating`) |
| GET `/api/admin/owners/available` | ADMIN | Owners without a store (for the "Add store" form) |
| GET `/api/stores` | USER, OWNER | Stores with overall rating and my rating (`search`, `sortBy=name\|address\|rating`, `ratedByMe=true`) |
| GET `/api/stores/:id` | USER, OWNER | One store |
| POST `/api/stores/:id/ratings` | USER, OWNER | Submit rating (updates if it already exists) |
| PATCH `/api/stores/:id/ratings` | USER, OWNER | Modify own rating |
| GET `/api/owner/dashboard` | USER, OWNER | Own store, average, count, breakdown (404 = no store yet) |
| POST `/api/owner/store` | USER, OWNER | Open your own store (one per account; you become its Store Owner) |
| GET `/api/owner/ratings` | USER, OWNER | Users who rated the own store (sort, pagination) |

---

## 6. Validation rules (client **and** server)

| Field | Rule |
|---|---|
| Name | 1-60 characters |
| Address | up to 400 characters |
| Password | 8-16 characters, at least one uppercase letter, at least one special character; confirmed on sign-up / change |
| Email | valid format, unique |
| Rating | whole number 1-5 |

## 7. Security measures
bcrypt password hashes (never returned by the API) · JWT (HS256) with expiry · role-based route and API protection ·
zod validation on every request with unknown fields removed (mass-assignment protection) · Prisma queries and
parameterised SQL only (sort columns come from a whitelist) · Helmet headers · CORS allow-list · rate limit on login/register
(20 attempts / 15 min) · no secrets in source: everything comes from `.env` · the first admin is created by a seed script from `.env`.

Dependency note: `npm audit` reports an advisory for zod 3.x (memory use when validating *oversized arrays/sets/maps*). This app has no array/collection validators and limits request bodies to 10 KB, so it is not reachable here. Upgrading to zod 4 needs a small code change to the error-message options and was not done.

Notes: the token is kept in the browser's `localStorage` (simple, but readable by injected scripts if the site ever had an XSS bug;
for a stricter setup use httpOnly cookies). Use HTTPS and a strong `JWT_SECRET` in production.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `psql` is not recognised | Open "SQL Shell (psql)" from the Start menu, or add `C:\Program Files\PostgreSQL\<version>\bin` to PATH |
| `Missing required environment variable` | You forgot `copy .env.example .env` in `server`, or a value is empty |
| `JWT_SECRET must be at least 32 characters long` | Generate one with the `node -e ...` command in Step 4 |
| `P1000 / P1001 Can't reach database server` or authentication failed | Check PostgreSQL is running, the password and port in `DATABASE_URL`, and that the database exists |
| `P3009 / migration failed` on a database you experimented with | For a development database only: `npx prisma migrate reset` (this ERASES the data) |
| `Cannot create the administrator. Fix these values` | The seed prints which `ADMIN_*` value breaks the rules |
| Browser says "Cannot reach the server" | Backend is not running, or `VITE_API_URL` in `client/.env` is wrong. Restart `npm run dev` after editing `.env` |
| CORS error / "Origin not allowed" | `CLIENT_ORIGIN` in `server/.env` must equal the URL in your address bar (default `http://localhost:5173`) |
| Port 5000 or 5173 already in use | Change `PORT` in `server/.env` (and `VITE_API_URL`), or stop the other program |
| "Too many attempts" | Login/register are limited; wait 15 minutes |
| `bcrypt` install error | Use Node.js LTS (20/22). If it still fails, install the Windows build tools: `npm i -g windows-build-tools` is outdated; instead re-run the Node installer and tick "Automatically install the necessary tools" |
| Tests fail with "TEST_DATABASE_URL is not set" | Add it to `server/.env` and create the `store_rating_test` database (Step 2) |

## 9. Production build
```powershell
cd client
npm run build      # creates client\dist (serve it with any static host)
cd ..\server
$env:NODE_ENV="production"; npm start
```
Set `CLIENT_ORIGIN` to your real site URL, use `npx prisma migrate deploy`, and keep `.env` out of Git.

---

## 10. Requirements checklist

> The "Coding Challenge V1.1" PDF itself was not attached, so this list follows the requirements written in the master prompt.
> Please compare it with your PDF.

| # | Requirement | Where it is implemented | Verified by |
|---|---|---|---|
| 1 | React + Vite, Express, PostgreSQL, Prisma, JWT, bcrypt, React Router, Axios | `client/`, `server/` | build + run |
| 2 | Single login for 3 roles, role-based redirect | `pages/Login.jsx`, `utils/constants.js (homePathForRole)` | browser test |
| 3 | Normal user signup; admin creates admins/users/owners | `Register.jsx`, `AddUser.jsx`, `admin.service.createUser` | tests + browser |
| 4 | Store owners tied to stores | `stores.owner_id` (unique), `admin.service.createStore`, DB trigger | tests |
| 5 | Password hashing, JWT, protected routes, no cross-role access, logout, change password | `auth.service`, `middleware/auth.js`, `ProtectedRoute.jsx`, `ChangePassword.jsx` | tests + browser |
| 6 | Invalid credentials, expired token, duplicate email, unauthorized handled | `errorHandler.js`, `auth.test.js`, `authorization.test.js` | tests |
| 7 | Admin dashboard: totals (users, stores, ratings) from DB | `AdminDashboard.jsx`, `admin.service.dashboard` | tests + browser |
| 8 | Admin adds stores (name, email, address, owner); list with average rating | `AddStore.jsx`, `StoresPage.jsx`, `store.service.listStores` | tests + browser |
| 9 | Admin adds users; list name/email/address/role; view details; owner's average rating | `AddUser.jsx`, `UsersPage.jsx`, `UserDetails.jsx` | tests + browser |
| 10 | Filter users by name/email/address/role; filter/search stores; sort asc/desc | `FilterControls.jsx`, `DataTable.jsx`, `useListQuery.js` | tests + browser |
| 11 | Normal user: signup, store list with overall rating, own rating, submit/modify | `UserDashboard.jsx`, `StoreBrowser.jsx`, `RatingModal.jsx` | tests + browser |
| 12 | Rating 1-5 integer, one per store per user, update instead of duplicate | `validators/common.js`, `store.service.submitRating`, DB `UNIQUE` + `CHECK` | tests + browser |
| 13 | Search by store name/address; sort by name and rating | `SearchBar.jsx`, `store.service.listStores` | tests + browser |
| 14 | Store owner: average rating + table of raters (name, email, rating, date), sort + pagination, own store only | `OwnerDashboard.jsx`, `owner.service.js` | tests + browser |
| 15 | Name 20-60, address <= 400, password 8-16 + uppercase + special, email valid and unique, rating 1-5 | `validators/*.js` (server), `utils/validators.js` (client), DB CHECKs | tests + browser |
| 16 | Field-level messages beside inputs | `TextField.jsx`, `useForm.js` | browser |
| 17 | Users / stores / ratings tables with PK, FK, constraints, indexes, transactions | `prisma/schema.prisma`, `migrations/*/migration.sql` | tests |
| 18 | REST endpoints listed in the prompt | `server/src/routes/*` (plus `/admin/owners/available`) | tests |
| 19 | Routes/controllers/services/middleware/config/validators/error utilities | `server/src/*` | review |
| 20 | Pagination, search, filter, sorting, consistent JSON, status codes, central errors | `utils/pagination.js`, `utils/response.js`, `errorHandler.js` | tests |
| 21 | 14 pages | `client/src/pages/*` | browser |
| 22 | Reusable components (navbar, sidebar, cards, tables, search, filters, rating input/display, forms, loaders, errors, dialogs, pagination) | `client/src/components/*` | review |
| 23 | Responsive, accessible, loading/empty states, notifications, confirmations | `index.css`, `ToastContext`, `ConfirmDialog` | browser (desktop + 390 px) |
| 24 | Security list (bcrypt, JWT, RBAC, validation, env secrets, safe queries, rate limit, CORS, Helmet, mass assignment, no hashes in responses, no hard-coded admin) | see section 7 | tests + curl |
| 25 | Safe way to create the first admin | `prisma/seed.js` (reads `.env`) | run |
| 26 | Beginner README with PowerShell commands, troubleshooting | this file | see "Not verified" below |
| 27 | Automated backend tests | `server/tests/*` (68 tests) | run |

### What was tested, and what was not
- **Tested:** all 68 backend tests pass against PostgreSQL 16 on Linux (Node 22). A scripted real-browser (Chromium) run
  covered login errors, admin user/store creation, signup validation, rating submit and modify, role blocking,
  owner dashboard, password change, filters, sorting and a phone-width layout (32 checks passed).
- **Not tested:** Windows itself, other browsers, Node 20, large data volumes, production hosting.
  The Windows PowerShell instructions follow the same commands that were run on Linux but were not executed on Windows.
- **Name rule:** names may be 1-60 characters (the original 20-character minimum was removed on request; see
  migration `20261027000000_relax_name_length`).
- **3D scenes** need WebGL. Without it (very old devices/browsers) a flat coloured skyline is shown instead.
  Animations stop when the tab is hidden and respect the "reduce motion" system setting.

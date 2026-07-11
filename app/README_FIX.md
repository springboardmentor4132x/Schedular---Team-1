# SocialPilot Auth Backend — Bug Diagnosis & Fix

## What was actually wrong

Your routing, Pydantic schemas, and import structure were **all fine** —
that wasn't the bug. I ran your exact code and reproduced the real issue:

**`passlib==1.7.4` is incompatible with `bcrypt>=4.1`.**

Passlib hasn't been updated since 2020. Its bcrypt backend checks an internal
attribute (`bcrypt.__about__.__version__`) to detect which bcrypt version is
installed. Recent bcrypt releases removed that attribute, so passlib's
version probe throws `AttributeError`, which cascades into:

```
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary
```

...every single time `get_password_hash()` or `verify_password()` ran —
i.e. every register and login call — with a `500 Internal Server Error`
and **no traceback printed to a normal console view** unless you scroll
uvicorn's log (this is exactly why it looked like a silent/UI bug rather
than a backend crash).

### Why it *looked* like a Swagger rendering bug
Intermittent "router not showing" / "No parameters" symptoms in `/docs`
are almost always one of:
- multiple `uvicorn --reload` worker processes left running on the same
  port from earlier runs (classic on Windows), so the browser randomly
  hits stale vs. current code
- browser-cached `/openapi.json`

Neither was present in your actual route/schema code — I verified the
generated OpenAPI spec has a correct `requestBody` for `/auth/register`
referencing your `UserCreate` schema. If you still see it happen locally:
1. Kill **all** python/uvicorn processes (`taskkill /f /im python.exe` on
   Windows, or `pkill -f uvicorn` on Mac/Linux) before restarting.
2. Hard refresh `/docs` (Ctrl+Shift+R) or open it in an incognito window.

## What I changed

**`app/services/auth_service.py`** — replaced `passlib.CryptContext` with
the `bcrypt` library directly. This is also the currently-recommended
approach since passlib is unmaintained; it removes the broken compatibility
shim entirely rather than just pinning an old bcrypt version (which would
bite you again on a future `pip install --upgrade`).

I also added the missing pieces referenced by your files but not uploaded,
so the whole thing runs standalone:
- `app/database.py` — SQLAlchemy engine/session, reads `DATABASE_URL` from
  env (defaults to SQLite for local dev; one-line swap to Postgres once
  merged with Member 3's setup)
- `app/models/user.py` — the `User` table
- `__init__.py` in each package folder

Your `main.py`, `routers/auth.py`, and `schemas/auth_schema.py` are kept
as you had them (they were already correct).

## Verified working (tested live, not just read)

```
POST /auth/register  -> 201 Created, returns JWT
POST /auth/login      -> 200 OK, returns JWT
POST /auth/register (duplicate email/phone) -> 400 Bad Request
POST /auth/login (wrong password) -> 401 Unauthorized
GET  /docs             -> 200, register/login show full JSON body inputs
```

## How to run

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then open http://127.0.0.1:8000/docs — both `/auth/register` and
`/auth/login` should show full request-body JSON editors.

## Merging with your teammates

- **Member 3 (Backend + Database)**: swap `DATABASE_URL` in `database.py`
  (or set it as an env var) to your real PostgreSQL connection string —
  nothing else needs to change. Coordinate so there's only one
  `database.py`/`models/` set, not two competing ones.
- **Member 2 (Auth UI)**: the register endpoint expects this JSON body:
  `full_name, email, phone, password, country?, role, organization?`.
  Login expects `email, password`. Both return
  `{ access_token, token_type }`.

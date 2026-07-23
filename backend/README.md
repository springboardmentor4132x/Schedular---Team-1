# SocialPilot backend

## Run

```powershell
cd backend
..\venv\Scripts\python.exe -m alembic upgrade head
..\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Swagger is available at `http://localhost:8000/docs`.

Run publishing work independently of HTTP:

```powershell
..\venv\Scripts\python.exe -m app.worker --interval 30
```

The current publishing adapter is intentionally development-mock only. It records
publishing logs and notifications but does not claim to create real social posts.

## Environment variables

Required: `DATABASE_URL`, `SECRET_KEY`.

Optional: `APP_BASE_URL`, `FRONTEND_URL`, `LINKEDIN_CLIENT_ID`,
`LINKEDIN_CLIENT_SECRET`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`,
`X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`, `FACEBOOK_CLIENT_ID`,
`FACEBOOK_CLIENT_SECRET`, `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`,
`PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET`.

Never commit the `.env` file or real OAuth credentials.

## Endpoint inventory

Authentication: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/me`,
`/auth/change-password`, `/auth/logout-all`.

Profile/common UI: `/profile`, `/profile/avatar`, `/settings`, `/dashboard`,
`/dashboard/summary`, `/activity`, `/notifications`, `/social/accounts`.

Content: `/media`, `/posts`, `/posts/{post_id}`, `/queue`, `/campaigns`,
`/campaigns/{campaign_id}`, `/campaigns/{campaign_id}/posts`, and
`/publishing/run-due`.

Collaboration: `/teams`, `/clients`, `/marketing-teams/discover`, and
`/collaboration-requests`.

Insights: `/analytics`, `/reports`, `/reports/{report_id}`.

All protected routes require `Authorization: Bearer <access_token>`.

## Verification

```powershell
cd backend
$env:PYTHONPATH='.'
..\venv\Scripts\python.exe -m unittest discover -s tests -v
```

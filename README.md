# SocialPilot - Social Media Scheduling & Management Platform

A robust, enterprise-grade multi-platform social media scheduling, campaign management, and analytics platform built with **FastAPI**, **React 19**, **Celery**, and **Redis**.

---

## 🌟 Key Features

- **Multi-Platform Publishing**: Schedule and publish content across **Facebook, Instagram, LinkedIn, YouTube, X (Twitter), and Pinterest**.
- **Role-Based Access Control (RBAC)**: Strict role-isolated interfaces and API enforcement across 4 specialized roles: **Administrator, Marketing Team, Content Creator, and Business User**.
- **Campaign & Content Management**: Full lifecycle support for content drafts, media uploads, scheduled queues, automated retries, and interactive calendar scheduling.
- **Client & Team Collaboration**: Marketing teams can discover, collaborate with, and manage assigned Business User workspaces.
- **Automated Background Workers**: Celery + Redis automated workers for scheduled publishing, retry loops, platform health checks, and metrics synchronization.
- **Analytics & Reporting**: In-depth post analytics, audience metrics, engagement trends, and platform comparison reports.

---

## 🔐 Role-Based Access Control (RBAC) Matrix

SocialPilot enforces strict role-based access control at both the **FastAPI backend layer** (route dependencies) and the **React frontend layer** (`RoleGuard` route wrapping):

| Role | Target Persona | Permissions & Scope of Authority |
| :--- | :--- | :--- |
| **Administrator** | Superuser / Platform Admin | • **Full Platform Authority**: Complete oversight over all platform data.<br>• **User Management**: Search, filter, create any role, edit profiles/roles, and delete accounts (with self-deletion protection).<br>• **Team & Client Oversight**: Manage all team workspaces, delete teams, and directly assign Business Users to Marketing Teams.<br>• **System Diagnostics**: Global KPI statistics, platform connection health status, audit trail activity logs, and global publishing queues. |
| **Marketing Team** | Agency / Marketing Lead | • **Client Workspace Management**: Manage multiple client brands, assign Content Creators, and oversee publishing pipelines.<br>• **Collaboration Hub**: Discover Business Users, send collaboration requests, and manage active client assignments.<br>• **Campaign & Content Scheduling**: Create and supervise campaigns, schedule client posts, manage queues, and review publishing logs.<br>• **Analytics Hub**: Access multi-client aggregated performance, engagement trends, and export reports. |
| **Content Creator** | Creator / Copywriter | • **Content Studio**: Create, edit, and draft rich multimedia posts with custom aspect ratios and platform-specific options.<br>• **Scheduling & Publishing**: Direct post scheduling, personal calendar view, queue management, and retry handling.<br>• **Personal Insights**: View post-level performance metrics, reach, reactions, and platform distribution. |
| **Business User** | Brand Owner / Client | • **Social Account Ownership**: Connect and manage OAuth credentials for brand social accounts.<br>• **Agency Collaboration**: Discover Marketing Teams, accept/decline/revoke collaboration requests.<br>• **Monitoring Dashboard**: Inspect campaign progress, live scheduled posts, and published metrics (**strictly read-only for content modification** to safeguard brand workflow). |

---

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Database**: SQLAlchemy, PostgreSQL / SQLite
- **Task Queue & Scheduler**: Celery + Celery Beat with Redis broker
- **Authentication & Security**: JWT (HS256 via `python-jose`), Passwords hashed with `bcrypt`, Token encryption at rest via `cryptography.fernet`
- **Validation**: Pydantic v2 Settings & Schemas

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing & State**: React Router DOM v7, Context API
- **Forms & Validation**: React Hook Form + Zod resolvers
- **UI & Visualization**: Recharts, React Icons (`react-icons/md`), Three.js / React Three Fiber, Vanilla CSS Design System
- **HTTP Client**: Axios with automatic JWT bearer injection and 401 interceptors

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Python** 3.11 or higher
- **Node.js** 18 or higher & **npm**
- **Redis Server** (Local or Docker on port `6379`)

---

### 1. Backend Setup

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=sqlite:///./socialpilot.db
   SECRET_KEY=your-super-secret-jwt-key-here-32-chars
   ENCRYPTION_KEY=your-fernet-encryption-key-base64
   APP_BASE_URL=http://localhost:8000
   FRONTEND_URL=http://localhost:5173

   # Celery & Redis
   REDIS_URL=redis://localhost:6379/0
   CELERY_BROKER_URL=redis://localhost:6379/0

   # Optional Social OAuth Credentials
   FACEBOOK_CLIENT_ID=
   FACEBOOK_CLIENT_SECRET=
   INSTAGRAM_CLIENT_ID=
   INSTAGRAM_CLIENT_SECRET=
   LINKEDIN_CLIENT_ID=
   LINKEDIN_CLIENT_SECRET=
   YOUTUBE_CLIENT_ID=
   YOUTUBE_CLIENT_SECRET=
   X_CLIENT_ID=
   X_CLIENT_SECRET=
   X_REDIRECT_URI=http://localhost:8000/social/callback/x
   PINTEREST_CLIENT_ID=
   PINTEREST_CLIENT_SECRET=
   ```

5. **Start the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs)*.

---

### 2. Background Workers (Celery & Beat)

To enable scheduled publishing, automated retries, and periodic analytics sync, start the Celery workers in separate terminal windows:

1. **Start Celery Worker**:
   ```bash
   cd backend
   celery -A app.core.celery_app worker --loglevel=info --pool=solo -Q celery,publishing,analytics,notifications
   ```

2. **Start Celery Beat Scheduler**:
   ```bash
   cd backend
   celery -A app.core.celery_app beat --loglevel=info
   ```

---

### 3. Frontend Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   *The application will be accessible at [http://localhost:5173](http://localhost:5173)*.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📁 Project Directory Structure

```plaintext
Schedular---Team-1/
├── backend/
│   ├── app/
│   │   ├── config.py             # Pydantic environment configuration
│   │   ├── database.py           # SQLAlchemy session and engine
│   │   ├── main.py               # FastAPI entrypoint & router registry
│   │   ├── core/                 # Security, Celery config, error handlers
│   │   ├── integrations/         # Social platform OAuth & API providers
│   │   ├── models/               # SQLAlchemy ORM models (User, Post, Team, etc.)
│   │   ├── routers/              # API endpoints (admin, auth, content, teams, etc.)
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/             # Core business logic & RBAC dependencies
│   │   └── tasks/                # Celery background tasks
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── assets/               # Static images and icons
│   │   ├── components/           # Reusable UI components & RoleGuard
│   │   ├── context/              # Global AppContext (auth, theme, sidebar)
│   │   ├── pages/
│   │   │   ├── LandingPage/      # Public landing & feature showcase
│   │   │   ├── Login/            # Authentication & sign in
│   │   │   ├── Register/         # User onboarding with role selection
│   │   │   ├── Profile/          # Profile details & avatar upload
│   │   │   ├── ConnectApps/      # Social media OAuth connections
│   │   │   ├── Settings/         # Notification & account settings
│   │   │   └── Dashboard/
│   │   │       ├── components/   # Sidebar, Navbar, StatsCard, Containers
│   │   │       ├── modules/      # Campaigns, Content, Publishing, Analytics
│   │   │       └── roles/
│   │   │           ├── Admin/    # Admin Dashboard, Users, Teams, Logs
│   │   │           ├── Business/ # Business User monitoring hub
│   │   │           ├── Marketing/# Agency campaign & client management
│   │   │           └── Creator/  # Content scheduling studio
│   │   ├── services/             # Axios API client modules
│   │   └── validation/           # Zod schema definitions
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🧪 Testing

- **Backend RBAC Verification**:
  ```bash
  cd backend
  python -m pytest
  ```
- **Frontend Validation**:
  ```bash
  cd frontend
  npm run lint
  npm run build
  ```

---

## 👥 Contributors
Developed by **Springboard Mentor & Schedular Team 1**.


Demo video link = https://drive.google.com/file/d/1HyBfs1dPuz0PNAIJS_-c8KQ9FFZdUtoB/view?usp=sharing
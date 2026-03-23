# Ladder – Automated Trading Platform

Ladder is a full-stack web application for managing and automating cryptocurrency and stock trading strategies. Users define "ladders" – sets of buy/sell steps at predefined price levels – and the platform executes, monitors, and reports on those orders through exchange APIs (Coinbase). An OpenAI integration provides AI-powered trade suggestions.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Key Technologies](#key-technologies)
3. [Architecture Overview](#architecture-overview)
4. [Backend – Django REST API](#backend--django-rest-api)
5. [Frontend – React + Redux](#frontend--react--redux)
6. [Local Development Setup](#local-development-setup)
7. [Production Deployment](#production-deployment)
8. [Environment Variables](#environment-variables)
9. [Running Tests](#running-tests)

---

## Project Structure

```
ladder/                          ← repository root
└── backend/                     ← all application code lives here
    ├── readMe.txt               ← detailed setup & deployment notes
    ├── requirements.txt         ← Python dependencies
    ├── frontend/                ← React single-page application
    │   ├── public/
    │   ├── build/               ← production build served by Django
    │   └── src/
    │       ├── actions/         ← Redux action creators
    │       ├── components/      ← reusable React components
    │       ├── constants/       ← shared string/number constants
    │       ├── reducers/        ← Redux reducers
    │       ├── screens/         ← page-level components (routes)
    │       ├── App.js           ← root component + route definitions
    │       ├── index.js         ← ReactDOM entry point
    │       ├── store.js         ← Redux store configuration
    │       └── axios.js         ← Axios instance with JWT interceptor
    └── ladder/                  ← Django project
        ├── manage.py
        ├── check_open_orders.py ← diagnostic script
        ├── db.sqlite3           ← SQLite file (dev only)
        ├── base/                ← main Django app
        │   ├── migrations/      ← database schema history (35+ files)
        │   ├── views/           ← request handlers (4 modules)
        │   ├── urls/            ← URL patterns (4 modules)
        │   ├── utils/           ← helper functions
        │   ├── models.py        ← ORM models
        │   ├── serializers.py   ← DRF serializers
        │   ├── signals.py       ← Django signals
        │   ├── admin.py         ← Django admin registration
        │   └── tests.py         ← unit tests
        ├── ladder/              ← Django project configuration
        │   ├── settings.py
        │   ├── urls.py          ← top-level URL routing
        │   ├── wsgi.py
        │   └── asgi.py
        ├── static/              ← user-uploaded media (images)
        └── staticfiles/         ← collected statics for production
```

---

## Key Technologies

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.14 | Runtime |
| Django | 6.0 | Web framework |
| Django REST Framework | 3.16.1 | REST API |
| djangorestframework-simplejwt | 5.5.1 | JWT authentication |
| django-cors-headers | 4.9.0 | CORS support |
| PostgreSQL / psycopg | 3.3.2 | Production database |
| Gunicorn | 25.0.1 | WSGI production server |
| WhiteNoise | 6.11.0 | Static file serving |
| Pillow | 12.0.0 | Image processing |
| coinbase-advanced-py | 1.8.2 | Coinbase Advanced Trade API |
| openai | 2.15.0 | AI trade suggestions |
| python-dotenv | 1.2.1 | Environment variable loading |
| cryptography (Fernet) | – | API credential encryption |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.3 | UI framework |
| React Bootstrap | 2.10.10 | Component library |
| react-router-dom | 7.10.1 | Client-side routing (HashRouter) |
| Redux | 5.0.1 | Global state management |
| redux-thunk | 3.1.0 | Async action middleware |
| Axios | 1.13.2 | HTTP client |
| Chart.js / Recharts | 4.5.1 / 3.6.0 | Data visualisation |
| FontAwesome Free | 7.1.0 | Icons |

### Infrastructure
| Component | Technology |
|---|---|
| Reverse proxy | Nginx |
| SSL | Certbot / Let's Encrypt |
| Conda environment | Python 3.14 |
| Version control | Git / GitHub |

---

## Architecture Overview

```
Browser (React SPA)
       │  HTTPS
       ▼
    Nginx  (:80 / :443)
       │  reverse proxy
       ▼
  Gunicorn  (:8000)
       │
  Django application
   ├── REST API  (/api/…)
   └── TemplateView → React build (all other routes)
       │
  PostgreSQL database
```

- The React frontend is built once (`npm run build`) and placed inside the Django project. Django serves `index.html` for every non-API route; React's `HashRouter` then handles navigation in the browser, avoiding server-side 404s on hard refresh.
- API calls from React go to `/api/…` which are handled by Django REST Framework views.
- JWT tokens are stored in `localStorage` and attached to every Axios request by an interceptor.

---

## Backend – Django REST API

### Data Models (`base/models.py`)

| Model | Description |
|---|---|
| `Ladders` | Trading ladder configuration (symbol, budget, steps, profit target, stop price) |
| `Steps` | Individual price step within a ladder |
| `Transactions` | Executed buy/sell orders linked to a step |
| `Profile` | Extended user profile with subscription status |
| `APICredentials` | Exchange API keys stored encrypted with Fernet |
| `Snapshot` | Daily profit/debt snapshot per ladder |
| `Historical` | Historical OHLCV price data |

### API Endpoints

| Prefix | Module | Responsibility |
|---|---|---|
| `/api/ladders/` | `base/views/ladder_views.py` | CRUD for ladders, stock/crypto price lookup, bulk operations |
| `/api/trade/` | `base/views/trade_views.py` | Order placement, trade execution, AI suggestions |
| `/api/users/` | `base/views/user_views.py` | Auth (login/register/reset), profile, API credentials |
| `/api/snapshot/` | `base/views/snapshot_views.py` | Historical data and chart snapshots |

### Authentication

1. User logs in via `POST /api/users/login/` and receives a JWT access token.
2. The token carries embedded user details (id, email, subscription).
3. All protected endpoints use DRF's `JWTAuthentication` permission class.

### API Credential Encryption

Exchange API keys are encrypted with a Fernet symmetric cipher before they are saved to the database. The key is set via the `ENCRYPTION_KEY` environment variable and the keys are decrypted on demand.

---

## Frontend – React + Redux

### Routing (`App.js`)

HashRouter is used so Django can always serve `index.html` regardless of the path fragment:

| Route | Screen |
|---|---|
| `/` | `HomeScreen` – dashboard |
| `/login`, `/register` | Auth screens |
| `/profile` | User profile & API credentials |
| `/ladder/:id` | Main ladder trading interface |
| `/ladder/:id/edit` | Ladder configuration editor |
| `/admin/userList`, `/admin/ladderList` | Admin views |

### Redux State Slices

| Slice | State held |
|---|---|
| `ladderList` / `ladderDetails` | List and detail of the user's ladders |
| `userLogin` / `userRegister` | Auth state and user info |
| `tradeDelete` / `tradeSuggestions` | Trade operations and AI suggestions |
| `snapshotData` / `historicalData` | Chart data |

### Key Components

| Component | Description |
|---|---|
| `Header.js` | Top navigation bar with user dropdown |
| `TransactionsTable.js` | Paginated transaction history table |
| `TransactionsStats.js` | Aggregate statistics (profit, volume, counts) |
| `LadderReport.js` | Per-ladder performance report |
| `LadderStepTab.js` | Visual display of all steps in a ladder |
| `Suggestions.js` | Renders AI trade suggestions |
| `Charts/` | Chart.js / Recharts wrappers for price and P&L charts |

---

## Local Development Setup

### Prerequisites

- [Conda](https://docs.conda.io/) (or any Python 3.14 environment)
- Node.js (LTS recommended)
- PostgreSQL running locally

### 1 – Backend

```bash
# Create and activate the Python environment
conda create -n ladder python=3.14 -y
conda activate ladder

# Navigate to the Django project
cd backend/ladder

# Install Python dependencies
pip install -r ../requirements.txt

# Copy and fill in environment variables (see section below)
cp .env.example .env   # edit with your values

# Apply database migrations
python manage.py migrate

# (Optional) Create a superuser for the Django admin
python manage.py createsuperuser

# Start the development server
python manage.py runserver
# API is now available at http://localhost:8000/api/
```

### 2 – Frontend

```bash
cd backend/frontend

# Install Node dependencies
npm install

# Start the React development server (proxies /api/ to :8000)
npm start
# App opens at http://localhost:3000
```

> The `"proxy": "http://127.0.0.1:8000"` entry in `package.json` forwards API requests to the Django dev server during development.

---

## Production Deployment

### 1 – Build the React app and collect statics

```bash
cd backend/frontend
npm run build           # output goes to backend/frontend/build/

cd ../ladder
python manage.py collectstatic --noinput
```

### 2 – Start Gunicorn

```bash
# From backend/ladder/
nohup /path/to/envs/ladder/bin/gunicorn ladder.wsgi:application \
    --bind 127.0.0.1:8000 > gunicorn.log 2>&1 &
```

### 3 – Configure Nginx

```nginx
server {
    listen 80;
    server_name ladder.melowise.com;

    location /static/ {
        alias /path/to/ladder/backend/ladder/staticfiles/;
        expires 30d;
    }

    location /media/ {
        alias /path/to/ladder/backend/ladder/static/images/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4 – SSL with Certbot

```bash
sudo certbot --nginx -d ladder.melowise.com
```

### Deploying code updates

```bash
conda activate ladder
cd /path/to/site/ladder
git fetch origin && git reset --hard origin/main
sudo killall gunicorn
cd backend/ladder
python manage.py collectstatic --noinput
nohup /path/to/envs/ladder/bin/gunicorn ladder.wsgi:application \
    --bind 127.0.0.1:8000 > gunicorn.log 2>&1 &
```

> Restart Gunicorn only when Django code, `settings.py`, or `.env` changes. React-only or static file changes do **not** require a Gunicorn restart.

---

## Environment Variables

Create a `.env` file inside `backend/ladder/` with the following keys:

```dotenv
# Django
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,your.server.ip

# Database (PostgreSQL)
DATABASE_NAME=ladder
DATABASE_USER=postgres
DATABASE_PASSWORD=your-db-password
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Encryption key for stored API credentials (generate with Fernet.generate_key())
ENCRYPTION_KEY=your-fernet-key

# Coinbase Advanced Trade API (optional – for live trading)
COINBASE_API_KEY=your-key
COINBASE_API_SECRET=your-secret

# OpenAI (optional – for trade suggestions)
OPENAI_API_KEY=your-key
```

---

## Running Tests

### Backend

```bash
cd backend/ladder
python manage.py test
```

### Frontend

```bash
cd backend/frontend
npm test
```

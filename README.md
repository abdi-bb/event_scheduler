# 🗓️ Event Scheduler

A powerful scheduling platform built with **Django 5**, **DRF**, **React (Next.js)**, and **Docker**, based on the [Cookiecutter Django](https://cookiecutter-django.readthedocs.io/en/latest/) project generator. Designed to support both **one-time and complex recurring events**, with full **user authentication and security**.

---

## ✅ Why Cookiecutter Django?

This project is scaffolded using **Cookiecutter Django**, a widely adopted production-ready Django starter template. It ensures:

- ✅ Secure-by-default configurations (e.g., CSRF, secure cookies, HTTP headers, password validation)
- ✅ Adherence to **industry-standard best practices** for security, code quality, and maintainability
- ✅ Scalable and extensible architecture
- ✅ Clear project layout promoting readability and ease of collaboration

By leveraging Cookiecutter, this project enforces a robust foundation aligned with Django’s security features and promotes long-term maintainability.

---

---

## 🧱 Project Structure

This project follows the modular and scalable architecture recommended in *Two Scoops of Django*, enabled by **Cookiecutter Django**. The layout ensures:

- 🔐 Strong separation of concerns (config, domain logic, APIs, storage, static assets)
- 🧩 Self-contained, reusable Django apps
- 🧪 Isolated and organized tests per feature
- 🛡️ Easy extension with production-level security features built-in

```graphql
event_scheduler/
├── config/                            # Project-level Django config
│   ├── settings/                      # Modular settings: base, local, production, etc.
│   │   ├── base.py
│   │   ├── local.py
│   │   ├── production.py
│   │   └── test.py
│   ├── api_router.py
│   ├── urls.py
│   └── wsgi.py
│
├── event_scheduler/                  # Core application codebase
│   ├── users/                        # Custom user model + auth
│   │   ├── api/                      # REST API endpoints for users
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   ├── permissions.py
│   │   │   ├── urls.py
│   │   │   └── exceptions.py
│   │   ├── models.py
│   │   ├── managers.py
│   │   ├── adapters.py
│   │   ├── signals.py
│   │   ├── context_processors.py
│   │   └── tests/                    # Tests for user-related logic
│   │       ├── test_models.py
│   │       ├── test_admin.py
│   │       └── api/
│   │           ├── test_views.py
│   │           └── test_urls.py
│   │
│   ├── events/                       # Recurring and one-time event logic
│   │   ├── api/                      # REST API endpoints for events
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── models.py
│   │   ├── admin.py
│   │   └── tests/                    # Tests for event scheduling logic
│   │       ├── test_models.py
│   │       ├── test_admin.py
│   │       └── api/
│   │           ├── test_views.py
│   │           └── test_urls.py
│   │
│   ├── utils/                        # Shared helper functions/utilities
│   ├── contrib/                      # Namespace for 3rd-party overrides (e.g., admin tweaks)
│   ├── static/                       # Static files for the Django backend
│   └── storage_backends.py          # Custom media/static file handling
│
├── frontend/                         # React (Next.js) frontend
│   └── ...                           # Handles user interaction, auth UI, scheduling UI
│
├── tests/                            # Root-level shared test helpers or global tests
│
├── .envs/                            # Environment-specific config (via script)
├── docker-compose.*.yml             # Compose files for local, prod, docs
├── merge_production_dotenvs_in_dotenv.py
├── justfile                          # Command runner shortcuts
├── manage.py
└── README.md
```

> ✅ Each app (`users`, `events`) is modular and self-contained, with a clear REST API (`api/`), models, admin, and dedicated tests.
> 🛠 The `config/` folder isolates project settings and startup logic for maximum clarity and deployment flexibility.

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository

```bash
git clone https://github.com/abdi-bb/event_scheduler.git
cd event_scheduler
````

### 2. Generate `.env` File

We use `.env` files for environment configuration. For convenience, the production `.envs/.production/*` files are included in version control.

Run the following command to merge them into a single `.env` file:

```bash
python3 merge_production_dotenvs_in_dotenv.py
```

> ℹ️ This script combines `.envs/.production/*` into one `.env` file for local development.

### 3. Set Docker Compose Environment

```bash
export COMPOSE_FILE=docker-compose.local.yml
```

### 4. Run the App

```bash
docker compose up --build
```

This will start both the **backend API** and **frontend** containers.

---

## 🌐 How to Access the App

- **Frontend (React UI)**
  [http://localhost:3000](http://localhost:3000)
  👉 Create an account, log in, and manage events from the browser.

- **API Docs (Swagger UI)**
  [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
  👉 Explore and test API endpoints directly.

---

## ✅ Core Features

🛡 **Authentication System**

- Secure user registration, login, logout
- Email-based login instead of username for a modern UX and to support features like password reset and email verification
- Email verification option (simulated via console output)
- Password reset
- JWT-based session handling (HttpOnly & secure)

📆 **Event Scheduling Engine**

- Create one-time or recurring events
- Supports complex rules:

  - Every *n* days/weeks/months
  - Specific weekdays (e.g., Mon/Wed)
  - Relative dates (e.g., 2nd Friday of the month)
  - Last weekday of the year, and more
- Edit or delete full series or single instances
- View events in calendar or list view

---

## 🧪 Testing Simulation

To run backend tests:

```bash
docker compose -f docker-compose.local.yml run --rm django pytest
```

> ⚠️ **Note:** This initial test files are included as placeholders. Full test coverage is still in progress due to time constraints in the challenge scope.

---

## 📝 License

MIT

---

## 📌 Notes

This project was developed as part of a coding challenge to demonstrate:

- A clean and extensible architecture
- Proper handling of **complex recurrence logic**
- Core flows for **authentication** and **event CRUD**
- Simple local setup using `docker compose up`

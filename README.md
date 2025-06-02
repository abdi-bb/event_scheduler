# 🗓️ Event Scheduler

A powerful scheduling platform built with **Django 5**, **DRF**, **React (Next.js)**, and **Docker**, based on the [Cookiecutter Django](https://github.com/cookiecutter/cookiecutter-django/) template. Designed to support both **one-time and complex recurring events**, with full **user authentication and security**.

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

* **Frontend (React UI)**
  [http://localhost:3000](http://localhost:3000)
  👉 Create an account, log in, and manage events from the browser.

* **API Docs (Swagger UI)**
  [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
  👉 Explore and test API endpoints directly.

---

## ✅ Core Features

🛡 **Authentication System**

* Secure user registration, login, logout
* Email verification option (simulated via console output)
* Password reset
* JWT-based session handling (HttpOnly & secure)

📆 **Event Scheduling Engine**

* Create one-time or recurring events
* Supports complex rules:

  * Every *n* days/weeks/months
  * Specific weekdays (e.g., Mon/Wed)
  * Relative dates (e.g., 2nd Friday of the month)
  * Last weekday of the year, and more
* Edit or delete full series or single instances
* View events in calendar or list view

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

* A clean and extensible architecture
* Proper handling of **complex recurrence logic**
* Core flows for **authentication** and **event CRUD**
* Simple local setup using `docker compose up`

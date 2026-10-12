# SMART QALA

**AI-assisted platform for citizen-led urban initiatives**

SMART QALA is a full-stack web application prototype that helps residents propose digital improvements for their city and follow how those proposals are reviewed. The platform connects three user roles—residents, government representatives, and administrators—through a shared initiative-management workflow.

An AI assistant helps residents formulate proposals from natural-language descriptions, while an AI classification step assigns each submitted initiative to a municipal topic. The interface supports **Russian and Kazakh**.

![SMART QALA concept artwork](frontend/src/assets/smart_qala.png)

## Project goals

- Make it easier for residents to describe local problems and propose practical digital solutions.
- Structure and categorize incoming initiatives without requiring users to fill out complex forms from scratch.
- Route initiatives to relevant government departments for review and assignment.
- Give residents visibility into initiative statuses, updates, and community support.

## Features

### For residents

- Register, sign in, and submit an urban initiative.
- Describe the **problem**, proposed **solution**, and **location**.
- Use a conversational AI assistant to prepare a structured proposal, or fill out the form manually.
- Attach an image or document (up to **5 MB**).
- Browse public initiatives, search, filter by category, and support proposals.
- View submitted initiatives, status history, and notifications in a personal dashboard.

### For government representatives

- Access initiatives associated with their assigned category.
- Allow department heads to assign initiatives to employees in their department.
- Update review statuses, including requesting clarification, completing, or rejecting a proposal.
- Record rejection reasons and maintain a status history that residents can view.

### For administrators

- Create and manage government staff accounts.
- Configure departmental categories and the **head / employee** hierarchy.
- Assign employees to department heads.

### AI-assisted processing

The backend integrates the **Google Gemini API** to:

1. Guide a resident through a short conversation in Russian or Kazakh.
2. Convert the collected information into a title, problem, solution, and location.
3. Classify a submitted initiative into one of the predefined categories, such as transport, ecology, public safety, education, healthcare, or urban infrastructure.

If AI classification is unavailable, the initiative can still be submitted with a **pending classification** category. AI chat and proposal preparation require a working Gemini API key and an available configured model.

## How it works

```mermaid
flowchart TD
    A[Resident describes a city issue] --> B{Submission method}
    B --> C[AI-guided conversation]
    B --> D[Manual form]
    C --> E[Structured initiative]
    D --> E
    E --> F[AI category classification]
    F --> G[Initiative saved to PostgreSQL]
    G --> H[Department review]
    H --> I[Assignment and status updates]
    I --> J[Resident sees progress and notifications]
```

The implementation supports the following review statuses: **Received**, **Under Review**, **In Progress**, **Clarification Needed**, **Completed**, and **Rejected** (stored in Russian in the current database/API).

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, JavaScript, CSS |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Database | PostgreSQL, SQLAlchemy, psycopg |
| AI integration | Google Gemini API (`google-genai`) |
| Supporting tools | Python dotenv, npm |

## Repository structure

```text
Smart Qala/
├── backend/
│   ├── main.py                # FastAPI routes, workflows, and AI integration
│   ├── models.py              # SQLAlchemy database models
│   ├── database.py            # Database connection and sessions
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── assets/            # Images and illustrations
│   │   ├── components/        # Shared UI components
│   │   ├── pages/             # Resident, government, and admin pages
│   │   ├── App.jsx            # Application routes and homepage
│   │   ├── LanguageContext.jsx # Russian/Kazakh language switching
│   │   └── ProtectedRoute.jsx # Client-side role-based navigation
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

Generated folders (`node_modules/`, `dist/`), local credentials (`.env`), and Git metadata (`.git/`) are intentionally excluded from the structure above and should not be uploaded as project files.

## Local setup

### Prerequisites

- Python **3.10+**
- Node.js and npm compatible with **Vite 8**
- A running **PostgreSQL** database
- A **Google Gemini API key** for AI functions

### 1. Configure PostgreSQL

Create a local PostgreSQL database, for example `smart_qala`, and note its user and password. The backend uses SQLAlchemy to create the defined tables when it starts.

### 2. Start the backend

From the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

**Windows (PowerShell)**

```powershell
.venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If pip cannot decode `requirements.txt`, resave it in **UTF-8** first; the copy in the supplied archive is encoded in UTF-16.

Create `backend/.env` (do not commit this file):

```dotenv
DATABASE_URL=postgresql+psycopg://DB_USER:DB_PASSWORD@localhost:5432/smart_qala
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Then start the API:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API documentation should be available at **http://127.0.0.1:8000/docs**, with a health endpoint at **http://127.0.0.1:8000/health**.

**Note:** The supplied backend currently expects both environment variables when starting. The configured Gemini model names and your key must be valid for the AI endpoints to work.

### 3. Start the frontend

Open another terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the development frontend at **http://localhost:5173**.

**Important for local development:** The frontend source files currently call a **hard-coded remote API base URL** (`https://smart-qala-api.onrender.com`). To connect the frontend to your locally running backend, replace that base URL in the frontend API requests with `http://127.0.0.1:8000`. This project does not currently use a centralized frontend API environment variable.

### 4. Accounts

Residents can register from the sign-in page. The admin and government dashboards require records with the corresponding roles in the database. The provided code does not include a documented admin-account seeding command, so those accounts must be provisioned separately for local testing.

## Main API endpoints

The application exposes interactive API documentation through FastAPI. Important endpoints include:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/register`, `/login` | Resident registration and login |
| `POST` | `/ai/chat` | Conversational proposal assistance |
| `POST` | `/ai/prepare-idea` | Convert a description into proposal fields |
| `GET`, `POST` | `/ideas` | Browse and submit initiatives |
| `GET` | `/users/{user_id}/ideas` | User's submitted initiatives |
| `GET` | `/ideas/{idea_id}/history` | Status history |
| `POST` | `/ideas/{idea_id}/support` | Toggle resident support |
| `GET` | `/users/{user_id}/notifications` | User notifications |
| `GET` | `/government/{user_id}/ideas` | Department's initiatives |
| `PATCH` | `/ideas/{idea_id}/assign` | Assign an employee |
| `PATCH` | `/ideas/{idea_id}/status` | Change review status |
| `GET`, `POST` | `/admin/employees` | View and add government staff accounts |

## Project status and limitations

SMART QALA is an **educational / demonstration prototype**, not a production-ready municipal service. In particular:

- Authentication, password storage, and backend authorization need security hardening before real-world use.
- The frontend currently uses local storage for its user session and hard-coded API URLs.
- AI output depends on external model availability, API credentials, and generated-response quality.
- Initiative processing represents an application workflow; it does not imply integration with an official city-government system.
- File uploads are stored in the database as encoded content; production deployments would benefit from dedicated file storage and stronger validation.

**Never upload `backend/.env`, database credentials, API keys, or `node_modules/` to GitHub.** Use sample placeholders when documenting environment variables.

## About

Developed as a prototype of a digital platform for citizen participation in urban improvements, combining full-stack web development with AI-assisted proposal preparation and classification.

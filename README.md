# Inquiro — Typeform Clone

A full-stack form builder and survey tool inspired by Typeform, featuring a drag-and-drop form builder, one-question-at-a-time respondent flow with smooth animations, and per-question analytics.

## Tech Stack

| Layer      | Technology                               |
|------------|------------------------------------------|
| Frontend   | Next.js 14 (TypeScript), Tailwind CSS    |
| Backend    | Python, FastAPI                          |
| Database   | SQLite (via SQLAlchemy ORM)              |
| State      | Zustand (builder state)                  |
| Drag & Drop| @dnd-kit                                 |
| Animations | Framer Motion                            |
| Validation | Zod (client-side) + Pydantic (server)    |

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
Backend runs at `http://localhost:8000`. The database and seed data are created automatically on first startup.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

## Architecture Overview

```
┌─────────────────┐      REST API       ┌──────────────────────┐
│   Next.js App   │ ◄──────────────────► │   FastAPI Backend    │
│   (Port 3000)   │   JSON over HTTP     │   (Port 8000)        │
│                 │                      │                      │
│  /forms         │                      │  /api/forms          │
│  /forms/[id]/   │                      │  /api/questions      │
│    builder      │                      │  /api/public/forms   │
│  /forms/[id]/   │                      │  /api/forms/{id}/    │
│    responses    │                      │    responses, summary│
│  /f/[slug]      │                      │                      │
└─────────────────┘                      └───────┬──────────────┘
                                                 │
                                         ┌───────▼──────────────┐
                                         │   SQLite Database    │
                                         │   (inquiro.db)       │
                                         └──────────────────────┘
```

### Frontend Architecture
- **App Router** with 4 route groups: dashboard, builder, responses, respondent flow
- **Zustand store** for builder state management with optimistic local updates
- **API client** (`src/lib/api.ts`) wraps all backend calls with JSON field parsing
- **Component registry** pattern: one component per question type under `src/components/questions/`
- **Debounced auto-save**: question edits are saved to backend after 500ms of inactivity

### Backend Architecture
- **Service-layer pattern**: routers → crud.py → SQLAlchemy models
- **Pydantic schemas** for request/response validation
- **SQLAlchemy ORM** with relationships and cascade deletes
- **Lifespan** context manager creates tables and seeds data on startup

## Database Schema

```
creators (id, name, email, created_at)
    │
    └── forms (id, creator_id FK, title, status, share_slug, theme_json,
    │          thank_you_message, created_at, updated_at, published_at)
        │
        ├── questions (id, form_id FK, type, title, description, is_required,
        │              order_index, settings_json, created_at, updated_at)
        │
        └── responses (id, form_id FK, started_at, submitted_at,
                       is_complete, completion_time_seconds)
                │
                └── answers (id, response_id FK, question_id FK,
                             value_text, value_number, value_json)
```

### Design Decisions
- **`order_index`** on questions: persists drag-and-drop reorder
- **`settings_json`** (TEXT): flexible per-type config (options list, rating scale) without extra tables
- **`share_slug`** on forms: decouples public sharing link from internal ID
- **Normalized answers**: separate rows per question per response, enabling aggregation for summary stats

### Supported Question Types (8)
`short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`, `number`, `yes_no`, `rating`

## API Overview

### Forms
| Method | Endpoint                      | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | `/api/forms`                  | List all forms with response count |
| POST   | `/api/forms`                  | Create new form                |
| GET    | `/api/forms/{id}`             | Get form with questions        |
| PATCH  | `/api/forms/{id}`             | Update form                    |
| DELETE | `/api/forms/{id}`             | Delete form                    |
| POST   | `/api/forms/{id}/duplicate`   | Duplicate form + questions     |
| POST   | `/api/forms/{id}/publish`     | Publish (generates slug)       |
| POST   | `/api/forms/{id}/unpublish`   | Unpublish                      |

### Questions
| Method | Endpoint                              | Description          |
|--------|---------------------------------------|----------------------|
| POST   | `/api/forms/{id}/questions`           | Add question         |
| PATCH  | `/api/questions/{qid}`                | Update question      |
| DELETE | `/api/questions/{qid}`                | Delete + reindex     |
| PATCH  | `/api/forms/{id}/questions/reorder`   | Reorder questions    |

### Public (no auth)
| Method | Endpoint                              | Description          |
|--------|---------------------------------------|----------------------|
| GET    | `/api/public/forms/{slug}`            | Get published form   |
| POST   | `/api/public/forms/{slug}/responses`  | Submit response      |

### Responses & Summary
| Method | Endpoint                              | Description          |
|--------|---------------------------------------|----------------------|
| GET    | `/api/forms/{id}/responses`           | List responses       |
| GET    | `/api/forms/{id}/responses/{rid}`     | Full response detail |
| GET    | `/api/forms/{id}/summary`             | Per-question stats   |

## Assumptions

1. **Simplified Auth**: Single seeded creator (`Demo User`). No login/signup required — spec explicitly allows this simplification.
2. **Batch Submit**: Responses are submitted all at once when the respondent completes the form (not per-question).
3. **Server Validation**: Email format, number format, valid option selection, and required field checks are enforced server-side.
4. **Client Validation**: Zod schemas validate each question before allowing the respondent to advance.
5. **Share Links**: Generated as short hex slugs from UUID4; published forms get a `/f/{slug}` URL.
6. **Seed Data**: 2 published forms with responses + 1 draft form are seeded on first startup.

## Seed Data

On first startup, the following are created automatically:
- **Customer Feedback Survey** (published, slug: `customer-feedback`) — 8 questions (one per type), 5 responses
- **Event Registration** (published, slug: `event-registration`) — 5 questions, 3 responses
- **Product Research Draft** (draft) — 3 questions, 0 responses

# Digital Legal Aid — Rwanda Justice Portal

A centralized platform for simplified access to justice information in Rwanda.  
Supporting **SDG 16: Peace, Justice and Strong Institutions**.

**Live deployment:** https://digital-legal-aid-frontend.vercel.app  
**Student:** Patrick Mukunzi | BSc. Software Engineering | African Leadership University (ALU) | 2026  
**Supervisor:** Bernard Lamptey

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Running the Project](#running-the-project)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [How the AI Works (RAG Pipeline)](#how-the-ai-works-rag-pipeline)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## Project Overview

The Digital Legal Aid platform addresses a critical gap in Rwanda's legal information ecosystem. While Rwanda has comprehensive legal infrastructure including IECMS, MAJ offices, and published legislation, this information is inaccessible to ordinary citizens — written in technical legalese, fragmented across multiple sources, and unavailable in Kinyarwanda.

This platform combines three modules:

1. **AI Legal Assistant** — answers legal questions in plain English or Kinyarwanda, citing specific Rwandan law articles
2. **Official Gazette Library** — searchable access to official Rwandan legal documents
3. **Notary Directory** — 143 NLA-verified private land notaries filterable by province and district

---

## Architecture

The platform uses a three-tier web architecture:

```
┌─────────────────────────────────────────────────┐
│           PRESENTATION LAYER                    │
│    React 18 SPA + Vite + React Router v6        │
│         http://localhost:3000                   │
└─────────────────┬───────────────────────────────┘
                  │ HTTP / REST
┌─────────────────▼───────────────────────────────┐
│           APPLICATION LAYER                     │
│      Node.js + Express REST API                 │
│         http://localhost:5000                   │
│  ┌──────────────────────────────────────────┐   │
│  │           AI SERVICES MODULE            │   │
│  │  ragService.js + translationService.js  │   │
│  │  Groq API (Llama-3.3-70b-versatile)     │   │
│  └──────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────┘
                  │ Mongoose ODM
┌─────────────────▼───────────────────────────────┐
│               DATA LAYER                        │
│         MongoDB + Full-text Index               │
└─────────────────────────────────────────────────┘
```

---

## Features

- Natural language legal Q&A in English and Kinyarwanda
- AI responses grounded exclusively in verified Rwandan statutes (RAG architecture)
- Every AI response cites the specific article number and statute
- Full-text search across official gazette documents
- Article-level navigation with Ask AI per article
- Notary directory filtered by province and district
- Role-based access: citizen, legal_aid_officer, admin
- Admin analytics dashboard (search trends, district breakdown)
- Anonymous mode for GBV-sensitive queries (no login, no IP logging)
- Mobile-first design, usable on 360px screens
- JWT authentication with bcrypt password hashing

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React.js | 18.x |
| Build Tool | Vite | 5.x |
| Routing | React Router | v6 |
| HTTP Client | Axios | latest |
| Charts | Recharts | 2.x |
| Backend | Node.js + Express | 20.x / 4.x |
| Database | MongoDB + Mongoose | 7.x |
| Authentication | JWT + bcrypt | — |
| AI/LLM | Groq API (Llama-3.3-70b) | — |
| PDF Parsing | pdf-parse | 1.x |
| File Upload | Multer | 1.x |
| Security | Helmet.js | 7.x |
| Logging | Winston | 3.x |
| Hosting | Vercel | — |

---

## Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** version 20.x or higher — https://nodejs.org
- **npm** version 9.x or higher (comes with Node.js)
- **MongoDB** — either local installation or a free MongoDB Atlas cluster
  - Local: https://www.mongodb.com/try/download/community
  - Atlas (recommended): https://www.mongodb.com/atlas/database
- **Groq API key** — free account at https://console.groq.com
  - After creating an account, go to API Keys and create a new key
  - The AI assistant will not function without this key

---

## Installation and Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/Mpatrick12/Digital-Legal-Aid.git
cd Digital-Legal-Aid
```

### Step 2 — Install all dependencies

This installs dependencies for the root, backend, and frontend in one command:

```bash
npm run install:all
```

If that command fails, install manually:

```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 3 — Set up environment variables

Create a `.env` file inside the `/backend` directory:

```bash
cd backend
cp .env.example .env
```

If `.env.example` does not exist, create `/backend/.env` manually with the following content:

```env
# Server
PORT=5000
NODE_ENV=development

# Database — use your MongoDB Atlas connection string or local MongoDB URI
MONGODB_URI=mongodb://localhost:27017/digital-legal-aid

# Authentication — change this to a long random string in production
JWT_SECRET=your-very-long-secret-key-change-this

# Groq API — get your free key at https://console.groq.com
GROQ_API_KEY=your-groq-api-key-here

# Frontend URL for CORS
CLIENT_URL=http://localhost:3000
```

> **Important:** The `GROQ_API_KEY` is required for the AI legal assistant to work. Without it the chatbot will return errors. Get a free key at https://console.groq.com — no credit card required.

Create a `.env` file inside the `/frontend` directory:

```bash
cd frontend
```

Create `/frontend/.env` with:

```env
VITE_API_URL=http://localhost:5000
```

---

## Database Seeding

The platform requires legal content, notary data, and an admin user in MongoDB before it can function. Run the seeding scripts in this exact order:

### Step 1 — Parse and seed legal content

This script parses the four official Rwandan legal documents and seeds them into MongoDB:

```bash
cd backend
node src/scripts/parseLaws.js
node src/scripts/seedData.js
```

This seeds the following documents into the `legalcontents` collection:
- Penal Code 2018 (Law N°68/2018) — sourced from rwandafda.gov.rw
- Penal Code Amendment 2023 (Law N°059/2023) — sourced from minijust.gov.rw
- GBV Law 2008 (Law N°59/2008) — sourced from rwandalii.org
- Criminal Procedure Code 2019 (Law N°27/2019) — sourced from rwandalii.org

### Step 2 — Seed the notary directory

```bash
node src/scripts/seedNotaries.js
```

This seeds 143 approved private land notaries from the National Land Authority's official published list into the `notaries` collection.

### Step 3 — Create an admin user (optional)

To access the admin analytics dashboard, create an admin user through the registration endpoint with role set to `admin`, or update an existing user's role directly in MongoDB:

```bash
# Using MongoDB shell
mongosh digital-legal-aid
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## Running the Project

### Development mode (both frontend and backend)

From the root directory:

```bash
npm run dev
```

This starts:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

### Run backend only

```bash
cd backend
npm run dev
```

### Run frontend only

```bash
cd frontend
npm run dev
```

### Verify the backend is running

Open http://localhost:5000/api/health in a browser. You should see:

```json
{ "status": "ok", "message": "Server is running" }
```

---

## Environment Variables

### Backend (`/backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port for the Express server (default: 5000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT token signing |
| `GROQ_API_KEY` | Yes | API key for Groq AI inference |
| `CLIENT_URL` | Yes | Frontend URL for CORS policy |

### Frontend (`/frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL |

---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT token |

### Legal Content

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/search?q=` | Yes | Full-text legal content search |
| POST | `/api/chat` | Yes | AI legal assistant (RAG pipeline) |

### Gazette

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/gazette` | No | Browse all gazette documents |
| POST | `/api/gazette/upload` | Admin | Upload gazette PDF with text extraction |
| GET | `/api/gazette/:id` | No | Get single gazette with extracted text |

### Notaries

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notaries` | No | Browse notaries, filter by district/province |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/stats` | Admin | Analytics data |
| GET | `/api/health` | No | Server health check |

---

## Project Structure

```
Digital-Legal-Aid/
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # LanguageContext for bilingual toggle
│   │   ├── App.jsx            # Main app with routing
│   │   └── main.jsx           # Entry point
│   ├── public/
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── LegalContent.js
│   │   │   ├── Gazette.js
│   │   │   ├── Notary.js
│   │   │   ├── Case.js
│   │   │   └── SearchLog.js
│   │   ├── routes/            # Express route handlers
│   │   │   ├── auth.js
│   │   │   ├── search.js
│   │   │   ├── chat.js
│   │   │   ├── gazette.js
│   │   │   ├── notaries.js
│   │   │   └── analytics.js
│   │   ├── middleware/        # Auth and validation middleware
│   │   │   ├── auth.js        # JWT verification
│   │   │   └── rateLimiter.js
│   │   ├── services/          # Business logic
│   │   │   ├── ragService.js  # RAG pipeline (core AI module)
│   │   │   └── translationService.js
│   │   ├── scripts/           # Database seeding scripts
│   │   │   ├── parseLaws.js
│   │   │   ├── seedData.js
│   │   │   └── seedNotaries.js
│   │   └── server.js          # Express app entry point
│   └── .env
├── Documents/                 # Project documentation
├── README.md
├── package.json               # Workspace configuration
└── vercel.json
```

---

## How the AI Works (RAG Pipeline)

The AI legal assistant uses **Retrieval-Augmented Generation (RAG)**, not a custom-trained machine learning model. This is an important distinction.

**What RAG means:**  
Instead of relying on a language model's general training data, the system first retrieves relevant documents from the verified legal database, then passes those documents as context to the language model. The model can only generate a response using what was retrieved — it cannot use general internet knowledge or invent legal provisions.

**Step-by-step pipeline** (implemented in `ragService.js`):

```
1. User submits query (English or Kinyarwanda)
         ↓
2. Language detection
   If Kinyarwanda → translationService.js translates to English
         ↓
3. MongoDB full-text search retrieves top 5 candidate articles
         ↓
4. Relevance scoring filters articles below 30% keyword match threshold
   (This prevents irrelevant articles from appearing in context)
         ↓
5. Remaining articles formatted as context string
         ↓
6. Groq API called with:
   - System prompt (instructions for legal plain-language explanation)
   - Retrieved articles as context
   - User query
   Model: llama-3.3-70b-versatile
         ↓
7. Response generated (grounded only in retrieved articles)
         ↓
8. If user language is Kinyarwanda → response translated back
         ↓
9. Response returned to user with source citations
```

**Why this approach:**  
General-purpose AI models (ChatGPT, Gemini) hallucinate when answering legal questions — they generate confident-sounding responses that may reference laws that do not exist or penalties that are incorrect. RAG eliminates this by constraining the model to verified sources. Every response in this platform is traceable to a specific article in a specific Rwandan statute.

**No training was required:**  
The Groq API provides access to the pre-trained Llama model. No custom ML training, no dataset preparation, and no GPU compute were required. The intelligence comes from the retrieval pipeline and the carefully designed system prompt, not from model training.

---

## Testing

### Unit tests

```bash
cd backend
npm test
```

Unit tests cover: authentication routes, search endpoint, gazette upload handling, rate limiting, and relevance scoring logic.

### Manual AI scenario testing

The platform was evaluated against 15 representative crime scenarios across English and Kinyarwanda. Results: 14/15 PASS (93% accuracy). The one partial pass was for an employment law query — labour law is outside the current database scope.

### Acceptance testing

User acceptance testing was conducted with 5 participants in Gasabo District, Rwanda. Average task completion time: 2.4 minutes on the platform versus 11.8 minutes using the traditional Official Gazette PDF method.

---

## Deployment

The platform is deployed on Vercel:

- **Frontend:** https://digital-legal-aid-frontend.vercel.app
- **Backend:** Deployed as Vercel serverless functions

### Deploy your own instance

1. Fork this repository
2. Create a Vercel account at https://vercel.com
3. Import the repository in Vercel
4. Set all environment variables from the Backend `.env` section in Vercel project settings
5. Deploy

The `vercel.json` file in the root directory configures the deployment routing.

---

## Known Limitations

- Legal database covers criminal law, GBV, and criminal procedure only. Labour law, family law, and commercial law are not yet included.
- Platform requires internet connectivity. PWA offline caching is planned for a future phase.
- Kinyarwanda voice output is not implemented — no production-quality Kinyarwanda TTS system is currently available.
- Free-tier hosting introduces occasional cold-start delays of 5 to 10 seconds on the first request after inactivity.
- User testing was a pilot study (n=10, Gasabo District) and is not statistically representative.

---

## License

MIT License

---

## Acknowledgments

- Aligned with Rwanda Vision 2050 and NST1
- Supporting UN SDG 16: Peace, Justice and Strong Institutions
- Supervisor: Bernard Lamptey, African Leadership University
- Legal content sourced from: minijust.gov.rw, rwandafda.gov.rw, rwandalii.org
- Notary data sourced from: National Land Authority (NLA) official list of approved private land notaries

---

## Contact

**Patrick Mukunzi**  
BSc. Software Engineering — African Leadership University  
Email: p.mukunzi@alustudent.com  
Project: https://github.com/Mpatrick12/Digital-Legal-Aid  
Live platform: https://digital-legal-aid-frontend.vercel.app

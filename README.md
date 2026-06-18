# Findoor — Egyptian Social Housing Platform

> Graduation project — A full-stack platform that connects citizens with government social-housing projects in Egypt, featuring an AI-powered Arabic chatbot, automated Egyptian NID card OCR, and a complete admin dashboard.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [Prerequisites](#prerequisites)
7. [Environment Variables (.env Setup)](#environment-variables)
8. [How to Run — Step by Step](#how-to-run)
9. [commands-to-run]
10. [API Reference](#api-reference)
11. [Mobile App Configuration](#mobile-app-configuration)

---

## Project Overview

**Findoor** is a government housing application system built as a graduation project. Citizens use the **Flutter mobile app** to browse housing projects, apply, chat with an AI assistant in Arabic, and scan their Egyptian National ID card to auto-fill application forms. Government employees use the **React web dashboard** to manage projects, review applications, and generate reports.

### Core Problems Solved

| Problem | Solution |
|---|---|
| Manual NID data entry with errors | Automated OCR extracts all 6 fields from Egyptian NID cards |
| No Arabic-language housing assistant | RAG-based LLM chatbot trained on project data answers in Arabic |
| Paper-based application process | Full digital workflow: apply → review → approve/reject → notify |
| Salary-based eligibility confusion | AI recommends suitable projects based on applicant salary |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FINDOOR SYSTEM                            │
│                                                                  │
│  ┌──────────────┐         ┌──────────────────────────────────┐  │
│  │ Flutter App  │◄───────►│   Node.js API  (port 3000)       │  │
│  │  (Mobile)    │  HTTP   │   Express + MongoDB + JWT         │  │
│  └──────────────┘         └───────┬──────────────┬───────────┘  │
│                                   │              │               │
│  ┌──────────────┐         ┌───────▼───────┐ ┌───▼────────────┐ │
│  │  React Web   │◄───────►│  FastAPI      │ │  Flask OCR     │ │
│  │  Dashboard   │  HTTP   │  AI Gateway   │ │  (port 5001)   │ │
│  │  (port 5173) │         │  (port 5000)  │ └────────────────┘ │
│  └──────────────┘         │  Groq LLM     │         │           │
│                           │  ChromaDB RAG │   Groq Vision LLM  │
│                           │  Embeddings   │   OpenCV Preproc.  │
│                           └───────────────┘                     │
└─────────────────────────────────────────────────────────────────┘

Data Flow:
  Mobile NID Scan → Node.js → Flask OCR → Groq Vision → 6 fields extracted
  Mobile Chatbot  → Node.js → FastAPI   → RAG Engine  → Arabic answer
  Web Dashboard   → Node.js → MongoDB   → CRUD response
```

### Services at a Glance

| Service | Port | Technology | Responsibility |
|---|---|---|---|
| Node.js API | 3000 | Express, Mongoose, JWT | Auth, projects, applications, proxy |
| React Dashboard | 5173 | React 19, Vite, Bootstrap | Admin UI |
| FastAPI AI Gateway | 5000 | FastAPI, Groq, ChromaDB | Arabic chatbot + salary recommendations |
| Flask OCR | 5001 | Flask, OpenCV, Groq Vision | Egyptian NID card scanning |

---

## Tech Stack

### Mobile (Flutter)
- **Flutter 3** — Dart SDK ≥ 3.3
- **Dio** — HTTP client with JWT injection
- **go_router** — Declarative navigation
- **Provider** — State management
- **camera / image_picker** — NID card scanning
- **shared_preferences** — Local storage (JWT, server IP)
- **flutter_local_notifications** — Push notifications

### Web Frontend
- **React 19** + **Vite 7**
- **React Router v6** — SPA routing
- **Bootstrap 5** + **React-Bootstrap** — UI components
- **Chart.js** + **react-chartjs-2** — Analytics charts
- **Vitest** — Unit tests
- **Playwright** — End-to-end tests

### Web Backend (Node.js)
- **Express 4** — REST API
- **Mongoose 8** — MongoDB ODM
- **JWT (jsonwebtoken)** — Authentication
- **bcryptjs** — Password hashing
- **Multer** — File uploads (JPEG/PNG/PDF, 5 MB limit)
- **express-validator** — Input validation

### AI Gateway (Python / FastAPI)
- **FastAPI** + **Uvicorn** — ASGI server
- **Groq** (`llama-3.3-70b-versatile`) — Primary LLM (Arabic)
- **Google Gemini** (`gemini-2.0-flash`) — Fallback LLM
- **ChromaDB** — Vector store for RAG
- **sentence-transformers** (`paraphrase-multilingual-mpnet-base-v2`) — Arabic embeddings
- **pandas** — Data analysis for salary recommendations

### OCR Server (Python / Flask)
- **Flask 3** — REST API
- **Groq Vision** (`meta-llama/llama-4-scout-17b-16e-instruct`) — LLM-based OCR
- **OpenCV** — Image preprocessing (CLAHE, top-hat transform, unsharp mask)
- **Pillow** — Image I/O

### Database
- **MongoDB** (local or Atlas) — All application data

---

## Project Structure

```
findoor/
│
├── web/
│   ├── frontend/          React admin dashboard (Vite)
│   │   ├── src/
│   │   │   ├── pages/     Login, Dashboard, Projects, Applications, etc.
│   │   │   ├── components/
│   │   │   ├── services/  API calls
│   │   │   └── context/   Auth context
│   │   └── package.json
│   │
│   └── backend/           Node.js REST API
│       ├── server.js
│       ├── routes/        auth, projects, applications, ocr, ai, upload
│       ├── controllers/
│       ├── models/        User, Project, Application, Notification, AuditLog
│       └── middleware/    JWT auth, audit logger
│
├── mobile/                Flutter app
│   ├── lib/
│   │   ├── core/          ApiConfig, theme, routing
│   │   └── features/
│   │       ├── auth/      Login, Register, Forgot Password
│   │       └── home/      Projects, NID Scan, Chatbot, Documents, Wallet
│   └── pubspec.yaml
│
├── ai/
│   ├── ai-gateway/        FastAPI Arabic LLM + RAG chatbot
│   │   ├── Backend/
│   │   │   ├── main.py    FastAPI app
│   │   │   ├── rag_engine.py
│   │   │   ├── safety.py
│   │   │   └── config.py
│   │   ├── chroma_db/     Vector store (auto-generated)
│   │   ├── Data/          Uploaded housing documents for RAG
│   │   └── venv/          Shared Python virtual environment
│   │
│   └── ocr/               Flask Egyptian NID OCR
│       ├── flask_api.py
│       ├── llm_extractor.py  Multi-pass Groq Vision pipeline
│       └── requirements.txt
│
├── projects_photo/        Housing project images
├── .gitignore
├── start_servers.bat      One-click launcher (Windows)
└── README.md
```

---

## Features

### Mobile App (Flutter)
- **Registration & Login** with JWT authentication
- **Browse housing projects** with photos, prices, and locations
- **Apply to a project** — documents uploaded directly from phone
- **NID Scanner** — Point camera at Egyptian NID card → all 6 fields auto-extracted:
  - Full name (Arabic)
  - National ID number (14 digits, validated)
  - Date of birth
  - Full address
  - District & governorate
  - Card serial number
- **Arabic AI Chatbot** — Ask questions about any project in Arabic
- **Documents Vault** — View all submitted documents
- **Application Status** — Track approval/rejection in real time
- **Push Notifications** — Receive updates from admins

### Admin Web Dashboard (React)
- **Role-based access** — Admin, Employee, Citizen roles
- **Project management** — Create, edit, delete housing projects with images
- **Application review** — Approve or reject citizen applications
- **User management** — View, suspend, manage citizen accounts
- **Analytics dashboard** — Charts for applications, approvals, regions
- **Audit logs** — Full activity trail for compliance

### AI Gateway (FastAPI)
- **Arabic RAG chatbot** — Retrieval-Augmented Generation over housing project data
- **Salary recommendations** — Enter monthly salary → get list of affordable projects
- **Session memory** — Chatbot remembers conversation history per session
- **Safety filter** — Blocks off-topic or harmful queries
- **API key authentication** — Secure internal endpoint

### OCR Server (Flask)
- **Multi-pass extraction pipeline** — Up to 10 LLM calls with different preprocessing per image
- **Supports both NID card designs** — Modern blue card and old gold/amber card
- **Image preprocessing** — CLAHE, top-hat transform, red-channel extraction, unsharp mask
- **Cross-validation** — Date of birth cross-checked against NID number for accuracy
- **Retry logic** — 3-attempt retry with back-off on Groq rate limits

---

## Prerequisites

Make sure the following are installed before running the project:

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Backend + Frontend |
| npm | ≥ 9 | Package manager |
| Python | ≥ 3.10 | AI Gateway + OCR |
| Flutter SDK | ≥ 3.3 | Mobile app |
| MongoDB | ≥ 6 (local) or Atlas | Database |
| Git | any | Clone repo |

---

## Environment Variables

The project has **3 separate `.env` files**. Do **not** commit real keys to GitHub.

---

### 1. `web/backend/.env`

Create this file by copying `web/backend/.env.example`:

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/findoor

# Server port (default: 3000)
PORT=3000

# Environment
NODE_ENV=development

# JWT secret — use a long random string in production
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random

# JWT expiry
JWT_EXPIRE=7d

# React frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

> **MongoDB Atlas**: replace `MONGODB_URI` with your Atlas connection string, e.g.:
> `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/findoor`

---

### 2. `ai/ai-gateway/.env`

Create this file in `ai/ai-gateway/`:

```env
# Groq API key — get free key at https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini key (fallback LLM) — get at https://aistudio.google.com
GEMINI_API_KEY=your_gemini_key_here

# MongoDB — same URI as backend (used for reading project data)
MONGODB_URI=mongodb://localhost:27017/findoor
MONGODB_DB=findoor

# Security: shared secret between Node.js and FastAPI
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
API_KEY=your_api_key_here

# CORS — use * for development, specific origins for production
ALLOWED_ORIGINS=*
```

---

### 3. `ai/ocr/.env`

Create this file in `ai/ocr/`:

```env
# Groq API key — same key works for OCR (Vision model)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## How to Run

### Option A — One Click (Windows)

Double-click `start_servers.bat` at the project root. It launches all 4 servers in separate terminal windows.

> Wait ~15 seconds for all services to fully start.

---

### Option B — Manual (Step by Step)

Follow these steps in order. Open a **separate terminal** for each server.

---

#### Step 1 — Install Python dependencies (once)

```bash
cd ai/ai-gateway
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

> The same `venv` is shared by both Python servers.

---

#### Step 2 — Create all `.env` files

Follow the [Environment Variables](#environment-variables) section above and create:
- `web/backend/.env`
- `ai/ai-gateway/.env`
- `ai/ocr/.env`

---

#### Step 3 — Start the Node.js API

```bash
cd web/backend
npm install
node server.js
```

Expected output:
```
MongoDB connected
Server running on port 3000
```

---

#### Step 4 — Start the React Dashboard

```bash
cd web/frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

#### Step 5 — Start the FastAPI AI Gateway

```bash
cd ai/ai-gateway/Backend
# Activate the venv first (see Step 1)
python main.py
# or: uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Interactive API docs: **http://localhost:5000/docs**

---

#### Step 6 — Start the Flask OCR Server

```bash
cd ai/ocr
# Activate the same venv
"../ai-gateway/venv/Scripts/python.exe" flask_api.py   # Windows
# or:
python flask_api.py
```

Expected output:
```
Flask OCR listening on port 5001
```

---

#### Step 7 — Run the Flutter Mobile App

```bash
cd mobile
flutter pub get
flutter run
```

> Connect a physical Android/iOS device or start an emulator first.
> Make sure your phone and PC are on the **same Wi-Fi network**.
> Set the server IP inside the app Settings screen (default: `192.168.1.8`).

---

### Seed the Database (optional)

```bash
cd web/backend
node seed.js           # Seed sample projects
node seed-projects.js  # Additional project data
```

---
## commands to write 
- & "B:\integerated grad\start_servers.bat"  
- cd "B:\integerated grad\mobile"
flutter run
  
            
## API Reference

### Node.js API — `http://localhost:3000/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login, returns JWT |
| GET | `/projects` | No | List all projects |
| POST | `/projects` | Admin | Create project |
| GET | `/applications` | JWT | List applications |
| POST | `/applications` | JWT | Submit application |
| PUT | `/applications/:id` | Admin | Approve / reject |
| POST | `/ocr/extract` | JWT | Proxy to Flask OCR |
| POST | `/ai/chat` | JWT | Proxy to FastAPI chatbot |
| POST | `/upload` | JWT | Upload document (max 5 MB) |

### FastAPI AI Gateway — `http://localhost:5000`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/chat` | API-Key | Arabic chatbot (RAG) |
| POST | `/recommend` | API-Key | Salary-based project recommendations |
| POST | `/chat/clear` | API-Key | Clear session history |
| GET | `/health` | No | Health check |
| GET | `/logs` | API-Key | Recent request logs |

### Flask OCR — `http://localhost:5001`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/ocr/extract` | Upload NID image (field: `image`) → returns 6 fields |
| GET | `/health` | Liveness probe |
| GET | `/status` | Active extraction method |

---

## Mobile App Configuration

The Flutter app communicates with the backend over your **local Wi-Fi network**.

1. Find your PC's local IP address:
   ```
   ipconfig       # Windows
   ifconfig       # macOS/Linux
   ```
2. Open the app → go to **Settings** → enter your PC's IP (e.g. `192.168.1.8`)
3. The app saves this and uses it for all API calls

The default IP is hardcoded as `192.168.1.8` in [mobile/lib/core/api_config.dart](mobile/lib/core/api_config.dart).

---

## Getting API Keys

| Key | Where to Get | Free Tier |
|---|---|---|
| `GROQ_API_KEY` | https://console.groq.com | 14,400 req/day |
| `GEMINI_API_KEY` | https://aistudio.google.com | 1M tokens/day |
| MongoDB Atlas | https://cloud.mongodb.com | 512 MB free |

---

## Team

Graduation project — Computer Science Department.

# Findoor — Integration Guide

## Architecture

```
Flutter Mobile App
       |
       |── auth/projects ──────────────────► Node.js  :3000  (FinalGRAD-main/backend)
       |
       |── chatbot ────────────────────────► FastAPI  :5000  (arabic LLM FINAL/Backend)
       |
       |── NID OCR ────────────────────────► FastAPI  :5000  /ocr/extract
       |                                          │
       |                                          └──(proxy)──► Flask OCR :5001 (OCR 2/OCR)
       |
       └── application submit / status ────► FastAPI  :5000  /api/application/*
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Python venv | `B:\arabic LLM FINAL\venv` |
| Flutter SDK | 3.x |
| MongoDB | running locally or Atlas URI in `.env` |

---

## Run Steps

### Option A — One-click (recommended)

Double-click **`start_servers.bat`** in the project root (`B:\integerated grad\`).

Three terminal windows open automatically:
- `Findoor Node.js :3000`
- `Findoor Flask OCR :5001`
- `Findoor FastAPI :5000`

Wait ~15 seconds for all three to fully initialise, then run the Flutter app.

---

### Option B — Manual (one terminal per server)

**1. Node.js API (port 3000)**
```bat
cd "B:\integerated grad\FinalGRAD-main\FinalGRAD-main\backend"
node server.js
```
Ready when you see: `Server running on port 3000`

**2. Flask OCR (port 5001)**
```bat
cd "B:\integerated grad\FinalGRAD-mobile\FinalGRAD-mobile\OCR 2\OCR"
"B:\arabic LLM FINAL\venv\Scripts\python.exe" flask_api.py
```
Ready when you see: `Running on http://0.0.0.0:5001`

**3. FastAPI AI Gateway (port 5000)**
```bat
cd "B:\integerated grad\FinalGRAD-mobile\FinalGRAD-mobile\arabic LLM FINAL\Backend"
"B:\arabic LLM FINAL\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```
Ready when you see: `Uvicorn running on http://0.0.0.0:5000`

**4. Flutter app**
```bat
cd "B:\integerated grad\FinalGRAD-mobile\FinalGRAD-mobile"
flutter run
```

**5. React Web app** (optional, for admin dashboard)
```bat
cd "B:\integerated grad\FinalGRAD-main\FinalGRAD-main"
npm install
npm start
```
Opens on `http://localhost:3001` and talks to Node.js on `http://localhost:3000`.

---

## Mobile device on Wi-Fi (physical phone)

1. Connect your phone and laptop to the **same Wi-Fi network**.
2. Find your laptop's LAN IP (e.g. `192.168.1.8`) with `ipconfig`.
3. Open `lib/core/api_config.dart` and update `_lanIp`:
   ```dart
   static const String _lanIp = '192.168.1.8'; // ← your machine's IP
   ```
4. Run the app on the device — it will automatically use the LAN IP.

---

## Verify all services are up

```
GET http://localhost:3000/api/health   → Node.js
GET http://localhost:5000/api/health   → FastAPI
GET http://localhost:5001/health       → Flask OCR
```

---

## What was integrated

| Feature | From | To |
|---|---|---|
| Login / Register | Flutter | Node.js `:3000/api/auth/*` |
| Projects list | Flutter | Node.js `:3000/api/projects` |
| Chatbot | Flutter | FastAPI `:5000/api/chat` |
| NID OCR scan | Flutter | FastAPI `:5000/ocr/extract` → Flask `:5001` |
| Application submit | Flutter | FastAPI `:5000/api/application/submit` |
| Application status | Flutter | FastAPI `:5000/api/application/track/:code` |
| Admin dashboard | React | Node.js `:3000/api/*` |

---

## Credentials stored (SharedPreferences)

| Key | Value |
|---|---|
| `auth_token` | JWT from Node.js login |
| `user_name` | Display name shown on home screen |
| `tracking_code` | Last submitted application tracking code |

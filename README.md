<div align="center">

# 🤖 AI Recruitment Intelligence System

### Screen 1000+ CVs in minutes. Rank candidates with transparent AI reasoning.

*Not just another CRUD app — a system that thinks like a senior recruiter.*

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude_AI-D97757?style=for-the-badge&logo=anthropic&logoColor=white)

</div>

---

## 💡 The Problem

Recruiters spend **23 hours** screening CVs for a single hire. Most resumes get **7 seconds** of attention. Great candidates slip through. Bias creeps in. The process doesn't scale.

## ✨ The Solution

An AI system that reads **every single CV in full**, scores candidates against the job description across multiple dimensions, and explains **exactly why** each candidate was ranked where they were — no black box, full transparency.

Upload **1000+ resumes** → AI analyzes them in parallel → Get a ranked shortlist with reasoning, in minutes.

---

## 🎯 Key Features

| Feature | What it does |
|---|---|
| 🔍 **Multi-Source Ingestion** | Pull CVs from local files, Google Drive, or AWS S3 — automatically |
| 🧠 **AI-Powered Parsing** | Extracts skills, experience, education & projects from PDF/DOCX (+ OCR for scanned docs) |
| 📊 **Semantic Matching** | Scores candidates on skills, experience, domain, education & project relevance |
| 🪟 **White-Box Reasoning** | Every score comes with *why this candidate is strong* and *where the gaps are* |
| 🏆 **Smart Ranking** | Ranked candidate table, top-10 shortlist & hire/no-hire recommendations |
| 🚨 **Quality Detection** | Flags duplicate CVs and inconsistencies automatically |
| 📤 **Export Reports** | One-click export to Excel & PDF for sharing with hiring teams |

---

## 🏗️ Architecture

A decoupled three-tier system where each service does one job well:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React Frontend │────▶│   Node.js API    │────▶│  FastAPI AI Engine  │
│   (Vite + UI)   │◀────│ (Express+MongoDB)│◀────│  (Claude + Parsing) │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
      :5173                    :5000                      :8000
```

| Layer | Tech | Responsibility |
|---|---|---|
| **Frontend** | React, Vite, TailwindCSS, Framer Motion | Interactive dashboard & results visualization |
| **API Gateway** | Node.js, Express, MongoDB | Orchestration, storage, exports, cloud uploads |
| **AI Engine** | Python, FastAPI, Claude AI | CV parsing, OCR, semantic scoring, ranking |

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/atlas))
- An [Anthropic API key](https://console.anthropic.com)

### 1. Clone & Install

```bash
git clone https://github.com/PrashanthAnanthan/AI-Recruitment-Intelligence-System.git

# Frontend
cd frontend && npm install

# Node backend
cd ../backend-node && npm install

# Python AI engine
cd ../backend-python
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy each `.env.example` to `.env` and fill in your values. **At minimum** you need MongoDB + Anthropic key; cloud keys are optional.

**`backend-node/.env`**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
PYTHON_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_here
```

**`backend-python/.env`**
```env
MONGO_URI=your_mongodb_connection_string
ANTHROPIC_API_KEY=your_anthropic_key
```

> 💡 AWS S3 and Google Drive keys are only needed if you want to pull CVs from the cloud. Local file uploads work out of the box.

### 3. Run All Services

Open **3 terminals**:

```bash
# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Node API
cd backend-node && npm run dev

# Terminal 3 — Python AI Engine
cd backend-python && python -m uvicorn main:app --reload --port 8000
```

🎉 Open **http://localhost:5173** and start screening.

---

## 🧠 How the Matching Engine Works

For each CV, the engine produces a weighted score (0–100) across five dimensions:

```
Total Score = Skills Match    × 30%
            + Experience Match × 25%
            + Domain Relevance × 20%
            + Education Match  × 15%
            + Project Match    × 10%
```

Crucially, the AI returns **structured reasoning** alongside every score — the specific skills that matched, the experience that aligned, and the gaps against the job description. This is what makes it a *white-box* system instead of an opaque number.

---

## 🛠️ Tech Stack

**Frontend:** React · Vite · TailwindCSS · Framer Motion · Recharts · React Router
**Backend:** Node.js · Express · MongoDB · Mongoose · Multer · ExcelJS · PDFKit
**AI Engine:** Python · FastAPI · Anthropic Claude · pdfplumber · python-docx · Tesseract OCR
**Cloud:** AWS S3 · Google Drive API

---

## 🗺️ Roadmap

- [ ] User authentication & role-based access
- [ ] Bulk job-posting management
- [ ] Interview question generation per candidate
- [ ] Bias-audit reporting
- [ ] Dockerized one-command deployment

---

## 📄 License

Released under the MIT License — free to use, modify, and build on.

---

<div align="center">

**Built to show what modern AI can do for hiring.**

⭐ Star this repo if you found it interesting!

</div>
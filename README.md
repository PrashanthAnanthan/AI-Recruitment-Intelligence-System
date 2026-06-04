<div align="center">
🤖 AI Recruitment Intelligence System
Screen hundreds of CVs in minutes. Rank candidates with transparent, explainable AI.
A full-stack system that reads every CV, scores it against the job description across five dimensions, and explains exactly why — no black box.
Show Image
Show Image
Show Image
Show Image
Show Image
</div>

💡 The Problem
Recruiters spend hours manually screening CVs for a single role. Strong candidates get missed, the process doesn't scale, and a plain keyword filter throws away nuance. Hiring teams need speed and judgment — not one at the cost of the other.
✨ The Solution
An AI system that reads every CV in full, scores each candidate against the job description across five weighted dimensions, and — crucially — explains why each one ranked where it did. A recruiter gets a ranked shortlist with clear, human-readable reasoning in minutes, then makes the final call themselves.

Human-in-the-loop by design. This tool assists hiring decisions — it surfaces and explains the best matches. It does not make hiring decisions autonomously. A recruiter always reviews and decides.


🎯 Key Features
FeatureWhat it does📥 Flexible CV intakeUpload files, drag-and-drop, or select an entire folder in one click (browser folder picker, works online). Local folder-path mode for on-machine use.🧠 AI-powered parsingExtracts name, contact, skills, experience, education and projects from PDF/DOCX, with OCR fallback for scanned documents.📊 Five-dimension scoringSkills, experience, domain relevance, education and projects — combined into a weighted 0–100 match score.🪟 White-box reasoningEvery score comes with specific strengths and gaps tied to the actual job requirements.🏆 Smart ranking & filtersRanked candidate table, top-10 shortlist, and "hire recommended" filter.✉️ One-click contactEach candidate card shows their email with an Email Candidate button that opens a pre-filled interview invitation.🚨 Quality flagsDetects duplicate CVs and inconsistencies automatically.📤 Export reportsOne-click export to Excel and PDF for sharing with hiring teams.

🏗️ Architecture
A decoupled three-tier system — each service does one job well:
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React Frontend │────▶│   Node.js API    │────▶│  FastAPI AI Engine  │
│  (Vite + UI)    │◀────│ (Express+MongoDB)│◀────│  (Claude + parsing) │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
      :5173                    :5000                      :8000
LayerTechResponsibilityFrontendReact, Vite, TailwindCSS, Framer Motion, RechartsInteractive dashboard, results visualization, exportsAPI GatewayNode.js, Express, MongoDB, MulterOrchestration, storage, file handling, report generationAI EnginePython, FastAPI, Anthropic Claude, pdfplumber, python-docxCV parsing, OCR, semantic scoring, ranking
The AI engine processes CVs in parallel batches and writes results back to MongoDB, which the frontend polls for live progress.

🧠 How the Matching Engine Works
For each CV, the engine produces a weighted score (0–100):
Total Score = Skills      × 30%
            + Experience  × 25%
            + Domain      × 20%
            + Education   × 15%
            + Projects    × 10%
The AI returns structured reasoning alongside every score — the specific skills that matched, the experience that aligned, and the gaps against the role. That reasoning is what makes this a white-box system rather than an opaque number.

⚡ Quick Start
Prerequisites

Node.js 18+
Python 3.10+
MongoDB (local or Atlas free tier)
An Anthropic API key

1. Clone & Install
bashgit clone https://github.com/PrashanthAnanthan/AI-Recruitment-Intelligence-System.git
cd AI-Recruitment-Intelligence-System

cd frontend && npm install
cd ../backend-node && npm install
cd ../backend-python
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
2. Configure Environment Variables
Copy each .env.example to .env and fill in your values.
backend-node/.env
envPORT=5000
MONGO_URI=your_mongodb_connection_string
PYTHON_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_here
backend-python/.env
envMONGO_URI=your_mongodb_connection_string
ANTHROPIC_API_KEY=your_anthropic_key_here

AWS S3 and Google Drive keys are optional — only needed to pull CVs from those cloud sources. File upload and folder selection work out of the box.

3. Run All Services
Open 3 terminals:
bash# Terminal 1 — Frontend
cd frontend && npm run dev

# Terminal 2 — Node API
cd backend-node && npm run dev

# Terminal 3 — Python AI Engine
cd backend-python && python -m uvicorn main:app --reload --port 8000
Open http://localhost:5173 and start screening.

📥 CV Source Options
SourceOnlineNotesLocal Files✅Drag-and-drop or browseSelect Folder✅Pick a whole folder in one click (Chrome/Edge)Folder Path⚠️ Local onlyType a path — works when the server runs on your own machineGoogle Drive / AWS S3✅Requires cloud credentials

🛠️ Tech Stack
Frontend: React · Vite · TailwindCSS · Framer Motion · Recharts · React Router
Backend: Node.js · Express · MongoDB · Mongoose · Multer · ExcelJS · PDFKit
AI Engine: Python · FastAPI · Anthropic Claude (Haiku) · pdfplumber · python-docx · Tesseract OCR
Cloud: MongoDB Atlas · AWS S3 · Google Drive API

🧗 Challenges & What I Learned
Building this end-to-end surfaced real engineering problems worth highlighting:

Multi-service orchestration — wiring a React frontend, Node API and Python AI engine to work together, each in its own runtime, talking over HTTP and sharing one database.
Reliable AI output — getting structured, parseable JSON back from the model consistently, including handling truncated responses and adding a heuristic fallback when parsing fails.
Browser security boundaries — learning why a web app can't read arbitrary file paths from a user's machine, and implementing the File System Access API folder picker as the correct online-safe solution.
Robust parsing — handling both digital and scanned PDFs (with OCR), plus DOCX, and normalizing inconsistent CV formats into structured data.
Secrets hygiene — keeping API keys out of version control and understanding push-protection.


🗺️ Roadmap

 Cloud deployment with a public live demo link
 User authentication & multi-recruiter accounts
 Anonymized / bias-aware screening mode
 Interview question generation per candidate
 Saved job-description templates


⚖️ Responsible Use
This system is a decision-support tool, not an automated gatekeeper. AI screening can reflect biases present in data and should never be the sole basis for a hiring or rejection decision. Outputs are intended to help a human recruiter review candidates faster and more consistently — the final judgment always stays with a person.

📄 License
Released under the MIT License — free to use, modify, and build on.

<div align="center">
Built to explore what modern AI can responsibly do for hiring.
⭐ Star this repo if you found it interesting!
</div>
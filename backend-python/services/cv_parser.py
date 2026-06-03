import os
import re
import pdfplumber
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from docx import Document
from pathlib import Path

UPLOAD_DIR = Path(__file__).parent.parent.parent / "backend-node" / "uploads"


def extract_text_from_pdf(filepath: str) -> str:
    """Try pdfplumber first; fallback to OCR for scanned PDFs."""
    text = ""
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
    except Exception:
        pass

    if len(text.strip()) < 100:  # Likely scanned — use OCR
        try:
            images = convert_from_path(filepath, dpi=200)
            for img in images:
                text += pytesseract.image_to_string(img) + "\n"
        except Exception as e:
            print(f"OCR error: {e}")

    return text.strip()


def extract_text_from_docx(filepath: str) -> str:
    try:
        doc = Document(filepath)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        print(f"DOCX error: {e}")
        return ""


def extract_text(filepath: str) -> str:
    fp = str(filepath).lower()
    if fp.endswith(".pdf"):
        return extract_text_from_pdf(filepath)
    elif fp.endswith((".docx", ".doc")):
        return extract_text_from_docx(filepath)
    return ""


def parse_email(text: str) -> str:
    m = re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", text, re.IGNORECASE)
    return m.group(0) if m else ""


def parse_phone(text: str) -> str:
    m = re.search(r"(\+?\d[\d\s\-().]{7,}\d)", text)
    return m.group(0).strip() if m else ""


def parse_name(text: str) -> str:
    """Heuristic: first non-empty line is usually the name."""
    for line in text.split("\n"):
        line = line.strip()
        if 2 < len(line) < 50 and not any(c.isdigit() for c in line[:5]):
            # Looks like a name
            if not any(kw in line.lower() for kw in ["email", "phone", "address", "cv", "resume", "objective"]):
                return line
    return "Unknown"


SKILL_SYNONYMS = {
    "ml": "Machine Learning",
    "ai": "Artificial Intelligence",
    "dl": "Deep Learning",
    "nlp": "Natural Language Processing",
    "js": "JavaScript",
    "ts": "TypeScript",
    "py": "Python",
    "k8s": "Kubernetes",
    "tf": "TensorFlow",
}

COMMON_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
    "React", "Vue", "Angular", "Node.js", "FastAPI", "Django", "Flask",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "TensorFlow", "PyTorch", "Scikit-learn", "Keras",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform",
    "Git", "CI/CD", "REST API", "GraphQL", "Microservices",
    "Agile", "Scrum", "Leadership", "Communication",
]


def extract_skills(text: str) -> list[str]:
    text_lower = text.lower()
    found = set()
    for skill in COMMON_SKILLS:
        if skill.lower() in text_lower:
            found.add(skill)
    # Normalize synonyms
    for abbr, full in SKILL_SYNONYMS.items():
        if re.search(rf"\b{abbr}\b", text_lower):
            found.add(full)
    return sorted(found)


def extract_experience(text: str) -> str:
    """Look for years of experience pattern."""
    m = re.search(r"(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)", text, re.IGNORECASE)
    if m:
        return f"{m.group(1)}+ years experience"
    # Count job blocks as fallback
    job_count = len(re.findall(r"\b(20\d{2}|19\d{2})\b", text))
    if job_count > 4:
        return "Senior level (multiple roles detected)"
    elif job_count > 2:
        return "Mid level"
    return "Entry/Unknown level"


def classify_seniority(text: str, years_str: str) -> str:
    text_lower = text.lower()
    if any(w in text_lower for w in ["lead", "principal", "head of", "director", "vp", "chief"]):
        return "Lead"
    if any(w in text_lower for w in ["senior", "sr.", "sr "]):
        return "Senior"
    if any(w in text_lower for w in ["junior", "jr.", "jr ", "intern", "graduate", "entry"]):
        return "Junior"
    m = re.search(r"(\d+)", years_str)
    if m:
        y = int(m.group(1))
        if y >= 7: return "Senior"
        if y >= 3: return "Mid"
        return "Junior"
    return "Mid"


def extract_education(text: str) -> str:
    degrees = ["PhD", "Ph.D", "Doctorate", "Master", "MSc", "MBA", "Bachelor", "BSc", "BA", "BE", "BTech"]
    for deg in degrees:
        if re.search(rf"\b{deg}\b", text, re.IGNORECASE):
            # Try to grab the line
            m = re.search(rf".{{0,20}}{deg}.{{0,60}}", text, re.IGNORECASE)
            return m.group(0).strip() if m else deg
    return "Not specified"


def load_file(file_id: str) -> tuple[str, str]:
    """Load a file from the uploads dir. Returns (text, filepath)."""
    for ext in ["", ".pdf", ".docx", ".doc"]:
        p = UPLOAD_DIR / (file_id if ext == "" else f"{file_id}")
        if p.exists():
            return extract_text(str(p)), str(p)
    # Try direct path
    p = UPLOAD_DIR / file_id
    if p.exists():
        return extract_text(str(p)), str(p)
    return "", ""

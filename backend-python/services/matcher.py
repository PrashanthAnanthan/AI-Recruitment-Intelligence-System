import os
import json
import re
import anthropic
from models.schemas import Candidate, MatchDetail

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


SYSTEM_PROMPT = """You are an expert AI recruitment analyst. 
Analyze CVs against job descriptions and return structured JSON ONLY.
Be objective, fair, and thorough. Always explain your reasoning."""


def build_analysis_prompt(cv_text: str, job_title: str, job_description: str) -> str:
    return f"""
Analyze this CV against the job description and return ONLY valid JSON (no markdown, no explanation outside JSON).

JOB TITLE: {job_title}

JOB DESCRIPTION:
{job_description[:3000]}

CV TEXT:
{cv_text[:4000]}

Return exactly this JSON structure:
{{
  "name": "candidate full name",
  "email": "email if found",
  "phone": "phone if found",
  "experience": "summary of experience e.g. '5 years Python developer'",
  "education": "highest degree + institution",
  "skills": ["skill1", "skill2", "skill3"],
  "seniority": "Junior|Mid|Senior|Lead",
  "overallScore": 75,
  "matchDetails": {{
    "skillMatch": 80,
    "experienceMatch": 70,
    "educationMatch": 65,
    "domainMatch": 75,
    "projectMatch": 60,
    "strengths": [
      "Has 5 years Python experience matching the required 4+",
      "Strong ML background aligns with job requirements"
    ],
    "weaknesses": [
      "Missing Kubernetes experience listed as required",
      "No cloud platform certifications mentioned"
    ]
  }},
  "inconsistencyFlag": false
}}

Score each dimension 0–100. overallScore = weighted average.
Be specific in strengths/weaknesses — reference actual job requirements.
"""


async def analyze_cv_with_ai(
    cv_text: str,
    job_title: str,
    job_description: str,
    file_name: str = ""
) -> Candidate:
    """Use Claude to analyze a CV and return a structured Candidate object."""
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{
                "role": "user",
                "content": build_analysis_prompt(cv_text, job_title, job_description)
            }]
        )

        raw = message.content[0].text.strip()
        
        # Strip markdown fences if present
        raw = re.sub(r"```json\s*", "", raw)
        raw = re.sub(r"```\s*", "", raw)
        raw = raw.strip()

        data = json.loads(raw)

        return Candidate(
            name=data.get("name", "Unknown"),
            email=data.get("email", ""),
            phone=data.get("phone", ""),
            experience=data.get("experience", ""),
            education=data.get("education", ""),
            skills=data.get("skills", []),
            seniority=data.get("seniority", "Unknown"),
            overallScore=float(data.get("overallScore", 0)),
            inconsistencyFlag=bool(data.get("inconsistencyFlag", False)),
            matchDetails=MatchDetail(**data.get("matchDetails", {})),
            fileName=file_name,
        )

    except json.JSONDecodeError as e:
        print(f"JSON parse error for {file_name}: {e}")
        return _fallback_candidate(cv_text, file_name)
    except Exception as e:
        print(f"AI analysis error for {file_name}: {e}")
        return _fallback_candidate(cv_text, file_name)


def _fallback_candidate(cv_text: str, file_name: str) -> Candidate:
    """Basic heuristic fallback if AI fails."""
    from services.cv_parser import (
        parse_name, parse_email, parse_phone,
        extract_skills, extract_experience, extract_education, classify_seniority
    )
    exp = extract_experience(cv_text)
    return Candidate(
        name=parse_name(cv_text),
        email=parse_email(cv_text),
        phone=parse_phone(cv_text),
        experience=exp,
        education=extract_education(cv_text),
        skills=extract_skills(cv_text),
        seniority=classify_seniority(cv_text, exp),
        overallScore=0,
        fileName=file_name,
        matchDetails=MatchDetail(strengths=["Analysis failed — heuristic fallback"], weaknesses=["Could not AI-analyze this CV"])
    )


def detect_duplicates(candidates: list[Candidate]) -> list[Candidate]:
    """Mark duplicates by name+email similarity."""
    seen = {}
    for c in candidates:
        key = f"{c.name.lower().strip()}_{c.email.lower().strip()}"
        if key in seen and key != "_":
            c.isDuplicate = True
        else:
            seen[key] = True
    return candidates

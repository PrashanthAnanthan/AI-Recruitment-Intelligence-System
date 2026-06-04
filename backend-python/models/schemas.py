from pydantic import BaseModel
from typing import Optional, List, Any

class FileObject(BaseModel):
    filename: str
    content: str  # base64 encoded
    mimetype: Optional[str] = "application/pdf"

class CVSource(BaseModel):
    type: str  # local | folder | drive | s3
    fileIds: Optional[List[str]] = []
    files: Optional[List[Any]] = []  # base64 file objects from Node
    folderPath: Optional[str] = None
    link: Optional[str] = None
    bucket: Optional[str] = None
    prefix: Optional[str] = ""
    region: Optional[str] = "us-east-1"
    keys: Optional[List[str]] = []

class ProcessRequest(BaseModel):
    screeningId: str
    jobTitle: str
    jobDescription: str
    cvSource: CVSource

class MatchDetail(BaseModel):
    skillMatch: float = 0
    experienceMatch: float = 0
    educationMatch: float = 0
    domainMatch: float = 0
    projectMatch: float = 0
    strengths: List[str] = []
    weaknesses: List[str] = []

class Candidate(BaseModel):
    name: str = "Unknown"
    email: str = ""
    phone: str = ""
    experience: str = ""
    education: str = ""
    skills: List[str] = []
    seniority: str = "Unknown"
    overallScore: float = 0
    isDuplicate: bool = False
    inconsistencyFlag: bool = False
    matchDetails: MatchDetail = MatchDetail()
    fileName: str = ""

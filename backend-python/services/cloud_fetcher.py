import os
import re
import boto3
import tempfile
from pathlib import Path
from typing import Generator

# Google Drive
try:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    from google.oauth2.service_account import Credentials
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False


def files_from_s3(bucket: str, prefix: str = "", region: str = "us-east-1", keys: list = None) -> Generator:
    """Download CV files from S3 and yield (file_bytes, filename) tuples."""
    s3 = boto3.client(
        "s3",
        region_name=region,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
        aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
    )
    
    if not keys:
        paginator = s3.get_paginator("list_objects_v2")
        keys = []
        for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
            for obj in page.get("Contents", []):
                if re.search(r"\.(pdf|docx|doc)$", obj["Key"], re.IGNORECASE):
                    keys.append(obj["Key"])

    for key in keys:
        try:
            obj = s3.get_object(Bucket=bucket, Key=key)
            data = obj["Body"].read()
            fname = key.split("/")[-1]
            yield data, fname
        except Exception as e:
            print(f"S3 error for {key}: {e}")


def files_from_drive(link: str) -> Generator:
    """Download CV files from a shared Google Drive folder."""
    if not GOOGLE_AVAILABLE:
        print("Google API client not installed")
        return

    creds_path = os.getenv("GOOGLE_CREDENTIALS_JSON")
    if not creds_path or not Path(creds_path).exists():
        print("Google credentials not configured")
        return

    folder_id = _extract_folder_id(link)
    if not folder_id:
        print(f"Could not extract folder ID from: {link}")
        return

    creds = Credentials.from_service_account_file(
        creds_path,
        scopes=["https://www.googleapis.com/auth/drive.readonly"]
    )
    service = build("drive", "v3", credentials=creds)

    results = service.files().list(
        q=f"'{folder_id}' in parents and trashed=false",
        fields="files(id, name, mimeType)",
        pageSize=1000,
    ).execute()

    for f in results.get("files", []):
        if not re.search(r"\.(pdf|docx|doc)$", f["name"], re.IGNORECASE):
            continue
        try:
            request = service.files().get_media(fileId=f["id"])
            with tempfile.NamedTemporaryFile(delete=False, suffix=Path(f["name"]).suffix) as tmp:
                downloader = MediaIoBaseDownload(tmp, request)
                done = False
                while not done:
                    _, done = downloader.next_chunk()
                tmp_path = tmp.name
            with open(tmp_path, "rb") as fp:
                data = fp.read()
            os.unlink(tmp_path)
            yield data, f["name"]
        except Exception as e:
            print(f"Drive error for {f['name']}: {e}")


def _extract_folder_id(link: str) -> str:
    """Extract folder ID from a Google Drive URL."""
    patterns = [
        r"folders/([a-zA-Z0-9_-]+)",
        r"id=([a-zA-Z0-9_-]+)",
        r"open\?id=([a-zA-Z0-9_-]+)",
    ]
    for p in patterns:
        m = re.search(p, link)
        if m:
            return m.group(1)
    return ""

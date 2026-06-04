import asyncio
import os
import base64
import tempfile
from pathlib import Path
from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks
from models.schemas import ProcessRequest, Candidate
from services.db import get_db
from services.cv_parser import extract_text
from services.matcher import analyze_cv_with_ai, detect_duplicates
from services.cloud_fetcher import files_from_s3, files_from_drive

router = APIRouter()

UPLOAD_DIR = Path(__file__).parent.parent.parent / "backend-node" / "uploads"


async def update_progress(screening_id: str, current: int, total: int, status: str = "processing"):
    db = get_db()
    await db.screenings.update_one(
        {"_id": ObjectId(screening_id)},
        {"$set": {"progress.current": current, "progress.total": total, "status": status}}
    )


async def process_pipeline(req: ProcessRequest):
    db = get_db()
    sid = req.screeningId

    try:
        await db.screenings.update_one(
            {"_id": ObjectId(sid)},
            {"$set": {"status": "processing"}}
        )

        cv_items: list[tuple[str, str]] = []  # (text, filename)

        if req.cvSource.type == "local":
            # NEW: handle base64 files sent directly from Node
            if hasattr(req.cvSource, 'files') and req.cvSource.files:
                for file_obj in req.cvSource.files:
                    try:
                        file_bytes = base64.b64decode(file_obj.get('content', ''))
                        fname = file_obj.get('filename', 'cv.pdf')
                        suffix = Path(fname).suffix or '.pdf'
                        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                            tmp.write(file_bytes)
                            tmp_path = tmp.name
                        text = extract_text(tmp_path)
                        os.unlink(tmp_path)
                        if text:
                            cv_items.append((text, fname))
                    except Exception as e:
                        print(f"Error processing base64 file: {e}")
            else:
                # Fallback: try local path (works when running locally)
                for file_id in (req.cvSource.fileIds or []):
                    fp = UPLOAD_DIR / file_id
                    if fp.exists():
                        text = extract_text(str(fp))
                        if text:
                            cv_items.append((text, fp.name))

        elif req.cvSource.type == "folder":
            folder = Path(req.cvSource.folderPath)
            if folder.exists():
                for f in folder.iterdir():
                    if f.suffix.lower() in (".pdf", ".docx", ".doc"):
                        text = extract_text(str(f))
                        if text:
                            cv_items.append((text, f.name))

        elif req.cvSource.type == "drive":
            for file_bytes, fname in files_from_drive(req.cvSource.link):
                suffix = Path(fname).suffix
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name
                text = extract_text(tmp_path)
                os.unlink(tmp_path)
                if text:
                    cv_items.append((text, fname))

        elif req.cvSource.type == "s3":
            for file_bytes, fname in files_from_s3(
                bucket=req.cvSource.bucket,
                prefix=req.cvSource.prefix,
                region=req.cvSource.region,
                keys=req.cvSource.keys,
            ):
                suffix = Path(fname).suffix
                with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                    tmp.write(file_bytes)
                    tmp_path = tmp.name
                text = extract_text(tmp_path)
                os.unlink(tmp_path)
                if text:
                    cv_items.append((text, fname))

        total = len(cv_items)
        await update_progress(sid, 0, total)

        if total == 0:
            await db.screenings.update_one(
                {"_id": ObjectId(sid)},
                {"$set": {"status": "failed", "error": "No readable CVs found"}}
            )
            return

        # Analyze each CV (parallel batches)
        candidates: list[Candidate] = []
        BATCH_SIZE = 25

        for batch_start in range(0, total, BATCH_SIZE):
            batch = cv_items[batch_start: batch_start + BATCH_SIZE]

            tasks = [
                analyze_cv_with_ai(text, req.jobTitle, req.jobDescription, fname)
                for text, fname in batch
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for r in results:
                if isinstance(r, Candidate):
                    candidates.append(r)

            await update_progress(sid, min(batch_start + BATCH_SIZE, total), total)

        # Post-processing
        candidates = detect_duplicates(candidates)
        candidates.sort(key=lambda c: c.overallScore, reverse=True)

        top_score   = candidates[0].overallScore if candidates else 0
        shortlisted = sum(1 for c in candidates if c.overallScore >= 75)

        cand_dicts = [c.model_dump() for c in candidates]

        await db.screenings.update_one(
            {"_id": ObjectId(sid)},
            {"$set": {
                "status":      "completed",
                "candidates":  cand_dicts,
                "totalCVs":    total,
                "topScore":    top_score,
                "shortlisted": shortlisted,
                "progress":    {"current": total, "total": total},
            }}
        )
        print(f"Screening {sid} complete - {total} CVs, top score: {top_score}")

    except Exception as e:
        print(f"Pipeline error for {sid}: {e}")
        await db.screenings.update_one(
            {"_id": ObjectId(sid)},
            {"$set": {"status": "failed", "error": str(e)}}
        )


@router.post("/process")
async def process_screening(req: ProcessRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_pipeline, req)
    return {"status": "processing started"}

from fastapi import APIRouter
router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "engine": "CV Screener AI v1.0"}

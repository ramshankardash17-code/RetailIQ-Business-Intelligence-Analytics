from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from retailiq.backend.app.db.session import get_db
from retailiq.backend.app.services.upload_service import UploadService
from retailiq.backend.app.schemas.predict import UploadSummaryResponse

router = APIRouter()

@router.post("", response_model=UploadSummaryResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = Form("sales"),
    db: Session = Depends(get_db)
):
    try:
        return await UploadService.process_file_upload(db=db, file=file, dataset_type=dataset_type)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")

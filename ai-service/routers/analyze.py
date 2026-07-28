from pathlib import Path

from fastapi import APIRouter, HTTPException

from schemas.analyze import (
    AnalyzeMealRequest,
    AnalyzeMealResponse,
    Detection,
)

from services.s3 import download_file
from services.detector import food_detector


router = APIRouter(
    prefix="/analyze",
    tags=["Analysis"],
)


@router.post(
    "/meal",
    response_model=AnalyzeMealResponse,
)
def analyze_meal(request: AnalyzeMealRequest):

    try:
        image_path = download_file(request.s3_key)

        detections = food_detector.analyse(image_path)

        return AnalyzeMealResponse(
            detections=[
                Detection(**item)
                for item in detections
            ]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        if "image_path" in locals():
            Path(image_path).unlink(missing_ok=True)
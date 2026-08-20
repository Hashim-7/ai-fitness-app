from pathlib import Path

from fastapi import APIRouter, HTTPException

from schemas.analyze import (
    AnalyzeMealRequest,
    AnalyzeMealResponse,
)

from services.s3 import download_file
from services.meal_nutrition import analyse_meal


router = APIRouter(
    prefix="/analyze",
    tags=["Analysis"],
)


@router.post(
    "/meal",
    response_model=AnalyzeMealResponse,
)
def analyze_meal(request: AnalyzeMealRequest):

    image_path = None

    try:
        image_path = download_file(request.s3_key)

        result = analyse_meal(image_path)

        return AnalyzeMealResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        if image_path is not None:
            Path(image_path).unlink(missing_ok=True)

from pathlib import Path

from fastapi import APIRouter, HTTPException

from schemas.analyze import (
    AnalyzeMealRequest,
    AnalyzeMealResponse,
    Macros,
)

from services.s3 import download_file

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

        #
        # Placeholder for food recognition model
        #

        return AnalyzeMealResponse(
            calories=0,
            macros=Macros(
                protein=0,
                carbs=0,
                fat=0,
            ),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        if "image_path" in locals():
            Path(image_path).unlink(missing_ok=True)
from pathlib import Path

from fastapi import APIRouter, HTTPException

from schemas.analyze import (
    AnalyzeMealRequest,
    AnalyzeMealResponse,
    Macros,
    FoodItem,
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
    foods=[
        FoodItem(
            name="Chicken Breast",
            estimated_grams=150,
            calories=248,
            protein=46,
            carbs=0,
            fat=5,
            confidence=0.95,
        )
    ],
    calories=248,
    macros=Macros(
        protein=46,
        carbs=0,
        fat=5,
    ),
    confidence=0.95,
)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        if "image_path" in locals():
            Path(image_path).unlink(missing_ok=True)
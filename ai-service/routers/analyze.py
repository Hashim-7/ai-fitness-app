from fastapi import APIRouter, HTTPException

from pydantic import BaseModel

from services.s3 import get_image_bytes
from services.gemini import analyse_meal


router = APIRouter(
    prefix="/analyze",
    tags=["analysis"],
)


class MealAnalysisRequest(BaseModel):
    s3_key: str


@router.post("/meal")
async def analyze_meal(request: MealAnalysisRequest):

    try:
        image_bytes = get_image_bytes(request.s3_key)

        result = analyse_meal(
            image_bytes=image_bytes,
            mime_type="image/jpeg",
        )

        return {
            "foods": [
                food.model_dump()
                for food in result.foods
            ],
            "total_calories": result.total_calories,
            "total_protein": result.total_protein,
            "total_carbs": result.total_carbs,
            "total_fat": result.total_fat,
        }

    except Exception as error:
        print(f"Meal analysis failed: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to analyse meal",
        )
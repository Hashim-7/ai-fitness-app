from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.s3 import get_image_bytes
from services.gemini import analyse_workout_form


router = APIRouter(
    prefix="/analyze",
    tags=["form_review"],
)


class FormReviewRequest(BaseModel):
    s3_key: str
    exercise_name: Optional[str] = None


@router.post("/form")
async def analyze_form(request: FormReviewRequest):
    try:
        video_bytes = get_image_bytes(request.s3_key)

        result = analyse_workout_form(
            video_bytes=video_bytes,
            mime_type="video/mp4",
            exercise_name=request.exercise_name,
        )

        return result.model_dump()

    except Exception as error:
        print(f"Workout form analysis failed: {error}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyse workout form video",
        )

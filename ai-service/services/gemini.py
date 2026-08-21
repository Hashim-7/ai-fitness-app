import os
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas.analyze import MealAnalysis
from schemas.form_review import FormReviewAnalysis


load_dotenv("../backend/.env")


client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"],
)


def analyse_meal(image_bytes: bytes, mime_type: str) -> MealAnalysis:

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type=mime_type,
            ),
            """
Analyze this meal image.

Identify every distinct substantial food visible.

For each food:

1. Identify the food.
2. Estimate the edible portion in grams.
3. Estimate calories for that portion.
4. Estimate protein in grams.
5. Estimate carbohydrates in grams.
6. Estimate fat in grams.
7. Give a confidence score from 0 to 1.

Do not identify tiny amounts of:
- salt
- pepper
- herbs
- seasoning
- incidental oil

Use the visible portion size in the image to make
reasonable estimates.

Do not invent foods that are not visibly present.

The totals must equal the sum of the individual foods.

Return only the requested structured data.
""",
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=MealAnalysis,
        ),
    )

    return MealAnalysis.model_validate_json(response.text)


def analyse_workout_form(
    video_bytes: bytes,
    mime_type: str = "video/mp4",
    exercise_name: Optional[str] = None,
) -> FormReviewAnalysis:

    prompt = f"""
You are an expert strength & conditioning coach and biomechanics specialist.
Analyze this video of a person performing an exercise.

Target Exercise: {exercise_name if exercise_name else 'Identify from video'}

Analyze the person's exercise form across all visible repetitions:
1. Identify the exercise being performed.
2. Rate overall form quality on a scale of 0 to 100.
3. Provide a concise summary of the set execution.
4. List specific body posture observations (head position, spine alignment, joint angles, depth, knee tracking, movement tempo).
5. List key positives (what technique elements were executed well).
6. List actionable coaching cues and step-by-step improvements to fix any flaws.
7. Highlight any critical injury risk warnings if dangerous form breakdown occurs.

Return only the requested structured data.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            types.Part.from_bytes(
                data=video_bytes,
                mime_type=mime_type,
            ),
            prompt,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=FormReviewAnalysis,
        ),
    )

    return FormReviewAnalysis.model_validate_json(response.text)
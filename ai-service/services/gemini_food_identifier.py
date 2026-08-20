from pathlib import Path

from google import genai
from google.genai import types
from pydantic import BaseModel, Field


class IdentifiedFood(BaseModel):
    name: str = Field(
        description="The common food name visible in the image."
    )
    confidence: float = Field(
        description="Confidence from 0 to 1 that this food is present."
    )


class FoodIdentification(BaseModel):
    foods: list[IdentifiedFood]


client = genai.Client()


def identify_foods(image_path: Path) -> list[dict]:

    image_bytes = image_path.read_bytes()

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg",
            ),
            """
Look at the meal image and identify every distinct, substantial food
item that is visibly present.

Return only foods that you can actually see in the image.

Use common food names. Be as specific as the image allows, but do not
invent ingredients or dishes that are not visually supported.

Do not identify tiny amounts of seasoning, salt, pepper, oil, herbs,
or other incidental ingredients unless they are clearly a substantial
part of the meal.

Do not estimate calories, weight, portion size, protein, carbohydrates,
or fat.

For each identified food, provide a confidence score from 0 to 1.
""",
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=FoodIdentification,
        ),
    )

    result = FoodIdentification.model_validate_json(
        response.text
    )

    return [
        {
            "name": food.name,
            "confidence": food.confidence,
        }
        for food in result.foods
    ]
from pydantic import BaseModel, Field


class MealFood(BaseModel):
    name: str = Field(
        description="Common name of the food visible in the image."
    )

    estimated_grams: float = Field(
        description="Estimated edible portion in grams."
    )

    calories: float = Field(
        description="Estimated calories for this portion."
    )

    protein: float = Field(
        description="Estimated protein in grams."
    )

    carbs: float = Field(
        description="Estimated carbohydrates in grams."
    )

    fat: float = Field(
        description="Estimated fat in grams."
    )

    confidence: float = Field(
        description="Confidence from 0 to 1."
    )


class MealAnalysis(BaseModel):
    foods: list[MealFood]

    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
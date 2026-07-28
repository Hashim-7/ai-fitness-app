from pydantic import BaseModel


class AnalyzeMealRequest(BaseModel):
    s3_key: str


class Macros(BaseModel):
    protein: float
    carbs: float
    fat: float


class FoodItem(BaseModel):
    name: str
    estimated_grams: float

    calories: int

    protein: float
    carbs: float
    fat: float

    confidence: float


class AnalyzeMealResponse(BaseModel):
    foods: list[FoodItem]

    calories: int

    macros: Macros

    confidence: float
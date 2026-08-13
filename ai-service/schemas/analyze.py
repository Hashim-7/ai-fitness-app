from pydantic import BaseModel


class AnalyzeMealRequest(BaseModel):
    s3_key: str


class FoodItem(BaseModel):
    name: str
    estimated_grams: float
    calories: float
    protein: float
    carbs: float
    fat: float
    confidence: float


class AnalyzeMealResponse(BaseModel):
    items: list[FoodItem]
from pydantic import BaseModel


class AnalyzeMealRequest(BaseModel):
    s3_key: str


class FoodItem(BaseModel):
    name: str
    confidence: float


class AnalyzeMealResponse(BaseModel):
    items: list[FoodItem]
    calories: float
    protein: float
    carbs: float
    fat: float

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


class Detection(BaseModel):
    class_id: int
    confidence: float


class AnalyzeMealResponse(BaseModel):
    detections: list[Detection]
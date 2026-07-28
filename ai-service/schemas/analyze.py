from pydantic import BaseModel


class AnalyzeMealRequest(BaseModel):
    s3_key: str


class Macros(BaseModel):
    protein: float
    carbs: float
    fat: float


class AnalyzeMealResponse(BaseModel):
    calories: int
    macros: Macros
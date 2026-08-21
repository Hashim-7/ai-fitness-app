from typing import Optional, List
from pydantic import BaseModel, Field


class FormReviewAnalysis(BaseModel):
    exercise_name: str = Field(description="Name of the exercise being performed")
    form_score: int = Field(description="Overall form score from 0 to 100")
    summary: str = Field(description="Brief summary of the form assessment")
    posture_feedback: List[str] = Field(description="Key body posture and alignment observations")
    positives: List[str] = Field(description="Technique elements done correctly")
    improvements: List[str] = Field(description="Actionable coaching cues to fix form")
    safety_warning: Optional[str] = Field(default=None, description="Injury risk or safety warning if form is dangerous")

from pathlib import Path

from services.food_nutrition import estimate_food_nutrition
from services.nutrition import NutritionDatabase


BASE = Path("ml/tests/fixtures")


def test_food_nutrition():

    database = NutritionDatabase(
        BASE / "ingredients_metadata_test.csv"
    )

    result = estimate_food_nutrition(
        "cottage cheese",
        100,
        database=database,
    )

    assert result is not None
    assert result["name"] == "cottage cheese"
    assert result["estimated_grams"] == 100
    assert result["calories"] == 98.0
    assert result["protein"] == 11.0
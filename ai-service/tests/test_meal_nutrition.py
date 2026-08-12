from pathlib import Path

from services.meal_nutrition import analyse_meal
from services.nutrition import NutritionDatabase


BASE = Path("ml/tests/fixtures")


def test_analyse_meal():

    database = NutritionDatabase(
        BASE / "ingredients_metadata_test.csv"
    )

    result = analyse_meal(
        BASE / "images" / "dish_test_001" / "rgb.png",
        database=database,
    )

    assert isinstance(result, list)
    assert len(result) > 0

    item = result[0]

    assert item["name"] == "cottage cheese"
    assert item["estimated_grams"] == 100
    assert item["calories"] == 98.0
    assert item["protein"] == 11.0
    assert 0 <= item["confidence"] <= 1
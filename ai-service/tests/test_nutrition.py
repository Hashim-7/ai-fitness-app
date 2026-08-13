from pathlib import Path

from services.nutrition import NutritionDatabase


BASE = Path("ml/tests/fixtures")


def test_nutrition_lookup():

    nutrition_db = NutritionDatabase(
        BASE / "ingredients_metadata_test.csv"
    )

    result = nutrition_db.lookup("cottage cheese")

    assert result is not None

    assert result["calories_per_g"] == 0.98
    assert result["protein_per_g"] == 0.11
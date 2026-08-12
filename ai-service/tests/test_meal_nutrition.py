from pathlib import Path

from services.meal_nutrition import analyse_meal


def test_analyse_meal():

    result = analyse_meal(
        Path("ml/tests/fixtures/images/dish_test_001/rgb.png")
    )

    assert isinstance(result, list)
    assert len(result) > 0

    item = result[0]

    assert item["name"] == "cottage cheese"
    assert item["estimated_grams"] == 100
    assert item["calories"] == 98.0
    assert item["protein"] == 11.0
    assert 0 <= item["confidence"] <= 1

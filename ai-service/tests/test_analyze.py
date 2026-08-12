from pathlib import Path

from services.meal_nutrition import analyse_meal


def test_analyse_meal():

    result = analyse_meal(
        Path(
            "datasets/sample_images/realsense_overhead/"
            "dish_1562688426/rgb.png"
        )
    )

    assert isinstance(result, list)
    assert len(result) > 0

    item = result[0]

    assert item["name"] == "cottage cheese"
    assert item["estimated_grams"] == 88.0

    assert item["calories"] >= 0
    assert item["protein"] >= 0
    assert item["carbs"] >= 0
    assert item["fat"] >= 0

    assert 0 <= item["confidence"] <= 1
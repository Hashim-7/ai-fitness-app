from pathlib import Path

from services.meal_nutrition import analyse_meal
from services.nutrition import NutritionDatabase
from services.portion_estimator import PortionEstimator


BASE = Path("ml/tests/fixtures")


class FakeFoodIdentifier:

    def identify(self, image_path):
        return [
            {
                "name": "cottage cheese",
                "confidence": 0.91,
            }
        ]


def test_analyse_meal():

    database = NutritionDatabase(
        BASE / "ingredients_metadata_test.csv"
    )

    portion_estimator = PortionEstimator(
        BASE / "portion_metadata_test.csv"
    )

    result = analyse_meal(
        BASE / "images" / "dish_test_001" / "rgb.png",
        database=database,
        portion_estimator=portion_estimator,
        food_identifier=FakeFoodIdentifier(),
    )

    assert isinstance(result, list)
    assert len(result) > 0

    item = result[0]

    assert item["name"] == "cottage cheese"
    assert item["estimated_grams"] == 100.0
    assert item["calories"] == 98.0
    assert item["protein"] == 11.0
    assert item["carbs"] == 3.4
    assert item["fat"] == 4.3
    assert item["confidence"] == 0.91
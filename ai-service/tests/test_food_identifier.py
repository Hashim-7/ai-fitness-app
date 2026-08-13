from pathlib import Path

from services.food_identifier import FoodIdentifier


BASE = Path("ml/tests/fixtures")


def test_food_identifier():

    identifier = FoodIdentifier(
        threshold=0.0,
    )

    result = identifier.identify(
        BASE / "images" / "dish_test_001" / "rgb.png"
    )

    assert isinstance(result, list)
    assert len(result) > 0

    food = result[0]

    assert "name" in food
    assert "confidence" in food
    assert isinstance(food["name"], str)
    assert 0 <= food["confidence"] <= 1
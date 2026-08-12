from pathlib import Path

from services.food_identifier import food_identifier


def test_food_identifier():

    result = food_identifier.identify(
        Path("ml/tests/fixtures/images/dish_test_001/rgb.png")
    )

    assert isinstance(result, list)
    assert len(result) > 0

    food = result[0]

    assert "name" in food
    assert "confidence" in food
    assert isinstance(food["name"], str)
    assert 0 <= food["confidence"] <= 1

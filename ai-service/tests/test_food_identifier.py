from pathlib import Path

import torch

from services.food_identifier import FoodIdentifier


BASE = Path("ml/tests/fixtures")


class FakeFoodClassifier:

    def __call__(self, images):
        return torch.tensor(
            [[2.0, 0.5]],
            dtype=torch.float32,
        )


def test_food_identifier():

    identifier = FoodIdentifier(
        threshold=0.0,
    )

    identifier.model = FakeFoodClassifier()
    identifier.ingredient_to_index = {
        "cottage cheese": 0,
        "strawberries": 1,
    }
    identifier.index_to_ingredient = {
        0: "cottage cheese",
        1: "strawberries",
    }

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
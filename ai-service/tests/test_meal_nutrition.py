from pathlib import Path

from services.meal_nutrition import analyse_meal


BASE = Path("ml/tests/fixtures")


class FakeFoodIdentifier:

    def identify(self, image_path):
        return [
            {
                "name": "cottage cheese",
                "confidence": 0.91,
            }
        ]


def fake_predict(image_path):
    return {
        "calories": 98.0,
        "protein": 11.0,
        "carbs": 3.4,
        "fat": 4.3,
        "confidence": 0.88,
    }


def test_analyse_meal(monkeypatch):

    monkeypatch.setattr(
        "services.meal_nutrition.predict",
        fake_predict,
    )

    result = analyse_meal(
        BASE / "images" / "dish_test_001" / "rgb.png",
        food_identifier=FakeFoodIdentifier(),
    )

    assert isinstance(result, dict)

    assert result["items"] == [
        {
            "name": "cottage cheese",
            "confidence": 0.91,
        }
    ]

    assert result["calories"] == 98.0
    assert result["protein"] == 11.0
    assert result["carbs"] == 3.4
    assert result["fat"] == 4.3

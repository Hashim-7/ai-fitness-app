from pathlib import Path

from ml.inference import predict
from ml.models.calorie_model import CalorieModel


BASE = Path("ml/tests/fixtures")

IMAGE_PATH = BASE / "images" / "dish_test_001" / "rgb.png"


def test_prediction_output():

    model = CalorieModel()
    model.eval()

    result = predict(
        str(IMAGE_PATH),
        model=model,
    )

    assert isinstance(result, dict)

    assert set(result.keys()) == {
        "calories",
        "protein",
        "carbs",
        "fat",
        "confidence",
    }


def test_prediction_values_are_valid():

    model = CalorieModel()
    model.eval()

    result = predict(
        str(IMAGE_PATH),
        model=model,
    )

    assert result["calories"] >= 0
    assert result["protein"] >= 0
    assert result["carbs"] >= 0
    assert result["fat"] >= 0
    assert 0 <= result["confidence"] <= 1
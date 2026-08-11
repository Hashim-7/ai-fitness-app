from pathlib import Path

from ml.inference import predict


IMAGE = Path(
    "datasets/sample_images/realsense_overhead/dish_1561662458/rgb.png"
)


def test_prediction_output():
    result = predict(str(IMAGE))

    assert set(result.keys()) == {
        "calories",
        "protein",
        "carbs",
        "fat",
        "confidence",
    }


def test_prediction_values_are_valid():
    result = predict(str(IMAGE))

    assert result["calories"] >= 0
    assert result["protein"] >= 0
    assert result["carbs"] >= 0
    assert result["fat"] >= 0

    assert 0 <= result["confidence"] <= 1
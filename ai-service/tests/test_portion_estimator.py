from pathlib import Path

from services.portion_estimator import PortionEstimator


BASE = Path("ml/tests/fixtures")


def test_portion_estimator():

    estimator = PortionEstimator(
        BASE / "portion_metadata_test.csv"
    )

    image_path = (
        BASE
        / "images"
        / "dish_test_001"
        / "rgb.png"
    )

    result = estimator.estimate(image_path)

    assert result == 100.0
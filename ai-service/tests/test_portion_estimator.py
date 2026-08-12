from pathlib import Path

from services.portion_estimator import PortionEstimator


def test_portion_estimator():

    estimator = PortionEstimator()

    image_path = Path(
        "datasets/sample_images/realsense_overhead/"
        "dish_1562688426/rgb.png"
    )

    result = estimator.estimate(image_path)

    assert result == 88.0
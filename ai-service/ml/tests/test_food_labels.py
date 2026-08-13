from pathlib import Path

from ml.datasets.food_labels import build_ingredient_to_index


BASE = Path("ml/tests/fixtures")


def test_build_ingredient_to_index():

    result = build_ingredient_to_index(
        BASE / "food_metadata_labels_test.csv",
        min_examples=2,
    )

    assert result == {
        "cottage cheese": 0,
        "strawberries": 1,
    }
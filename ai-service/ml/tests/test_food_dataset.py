from pathlib import Path

from ml.datasets.food_dataset import FoodDataset


BASE = Path("ml/tests/fixtures")


def test_food_dataset():

    ingredient_to_index = {
        "cottage cheese": 0,
        "strawberries": 1,
    }

    dataset = FoodDataset(
        image_root=BASE / "images",
        metadata_path=BASE / "food_metadata_test.csv",
        ingredient_to_index=ingredient_to_index,
    )

    assert len(dataset) == 1

    image, target = dataset[0]

    assert image.shape == (3, 224, 224)
    assert target.shape == (2,)

    assert target[0] == 1
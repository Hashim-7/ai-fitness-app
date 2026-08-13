from pathlib import Path

from torchvision import transforms

from ml.datasets.nutrition_dataset import Nutrition5kDataset


BASE = Path("ml/tests/fixtures")


dataset = Nutrition5kDataset(
    metadata_file=BASE / "dish_metadata_test.csv",
    image_dir=BASE / "images",
    transform=transforms.ToTensor(),
)


def test_dataset_loads():
    assert len(dataset) > 0


def test_sample():
    image, target = dataset[0]

    assert image.shape[0] == 3

    assert "calories" in target
    assert "protein" in target

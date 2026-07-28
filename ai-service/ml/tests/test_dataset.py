from torchvision import transforms

from ml.datasets.nutrition_dataset import Nutrition5kDataset


dataset = Nutrition5kDataset(
    metadata_file="datasets/metadata/dish_metadata_cafe1.csv",
    image_dir="datasets/sample_images/realsense_overhead",
    transform=transforms.ToTensor(),
)


def test_dataset_loads():
    assert len(dataset) > 0


def test_sample():
    image, target = dataset[0]

    assert image.shape[0] == 3

    assert "calories" in target
    assert "protein" in target
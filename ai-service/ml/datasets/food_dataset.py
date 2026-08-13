import csv
from pathlib import Path

import torch
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms


class FoodDataset(Dataset):

    def __init__(
        self,
        image_root: Path,
        metadata_path: Path,
        ingredient_to_index: dict[str, int],
        transform=None,
    ):
        self.image_root = Path(image_root)
        self.metadata_path = Path(metadata_path)
        self.ingredient_to_index = ingredient_to_index

        self.transform = transform or transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
            ]
        )

        self.samples = self._build_samples()

    def _build_samples(self):

        samples = []

        with open(self.metadata_path, newline="") as file:
            reader = csv.reader(file)

            for row in reader:

                if not row:
                    continue

                dish_id = row[0]

                image_path = (
                    self.image_root
                    / dish_id
                    / "rgb.png"
                )

                if not image_path.exists():
                    continue

                labels = []

                values = row[6:]

                for i in range(0, len(values), 7):

                    if i + 1 >= len(values):
                        continue

                    ingredient = values[i + 1]

                    if ingredient in self.ingredient_to_index:
                        labels.append(
                            self.ingredient_to_index[ingredient]
                        )

                if labels:
                    samples.append(
                        (
                            image_path,
                            sorted(set(labels)),
                        )
                    )

        return samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):

        image_path, labels = self.samples[index]

        image = Image.open(image_path).convert("RGB")
        image = self.transform(image)

        target = torch.zeros(
            len(self.ingredient_to_index),
            dtype=torch.float32,
        )

        for label in labels:
            target[label] = 1.0

        return image, target
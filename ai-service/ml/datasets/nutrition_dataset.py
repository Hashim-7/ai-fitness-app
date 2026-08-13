from pathlib import Path
import csv
import torch

from PIL import Image
from torch.utils.data import Dataset


class Nutrition5kDataset(Dataset):
    def __init__(
        self,
        metadata_file: str,
        image_dir: str,
        transform=None,
    ):
        self.image_dir = Path(image_dir)
        self.transform = transform

        self.samples = []

        with open(metadata_file, newline="") as f:
            reader = csv.reader(f)

            for row in reader:
                dish_id = row[0]

                image_path = (
                    self.image_dir
                    / dish_id
                    / "rgb.png"
                )

                if not image_path.exists():
                    continue

                self.samples.append(
                    {
                        "image": image_path,
                        "calories": float(row[1]),
                        "fat": float(row[3]),
                        "carbs": float(row[4]),
                        "protein": float(row[5]),
                    }
                )

        print(f"Loaded {len(self.samples)} samples")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]

        image = Image.open(item["image"]).convert("RGB")

        if self.transform:
            image = self.transform(image)

        target = {
    "calories": torch.tensor(item["calories"]),
    "protein": torch.tensor(item["protein"]),
    "carbs": torch.tensor(item["carbs"]),
    "fat": torch.tensor(item["fat"]),
}

        return image, target
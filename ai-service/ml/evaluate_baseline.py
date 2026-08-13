import torch
from torch.utils.data import random_split

from ml.datasets.nutrition_dataset import Nutrition5kDataset


dataset = Nutrition5kDataset(
    metadata_file="datasets/metadata/dish_metadata_cafe1.csv",
    image_dir="datasets/sample_images/realsense_overhead",
)


train_size = int(len(dataset) * 0.8)
val_size = len(dataset) - train_size

train_dataset, val_dataset = random_split(
    dataset,
    [train_size, val_size],
    generator=torch.Generator().manual_seed(42),
)


targets = []

for _, target in train_dataset:
    targets.append([
        target["calories"],
        target["protein"],
        target["carbs"],
        target["fat"],
    ])


train_targets = torch.tensor(targets)

mean_target = train_targets.mean(dim=0)

errors = []

for _, target in val_dataset:

    actual = torch.tensor([
        target["calories"],
        target["protein"],
        target["carbs"],
        target["fat"],
    ])

    errors.append(
        torch.abs(actual - mean_target)
    )


mae = torch.stack(errors).mean(dim=0)


print()
print("Baseline MAE")
print("----------------")
print(f"Calories: {mae[0]:.2f} kcal")
print(f"Protein:  {mae[1]:.2f} g")
print(f"Carbs:    {mae[2]:.2f} g")
print(f"Fat:      {mae[3]:.2f} g")
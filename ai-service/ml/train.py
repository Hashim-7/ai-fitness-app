from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader

from torchvision import transforms

from ml.datasets.nutrition_dataset import Nutrition5kDataset
from ml.models.calorie_model import CalorieModel

device = torch.device(
    "mps"
    if torch.backends.mps.is_available()
    else "cpu"
)

print(device)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

dataset = Nutrition5kDataset(
    metadata_file="datasets/metadata/dish_metadata_cafe1.csv",
    image_dir="datasets/sample_images/realsense_overhead",
    transform=transform,
)

loader = DataLoader(
    dataset,
    batch_size=8,
    shuffle=True,
)

model = CalorieModel().to(device)

criterion = nn.MSELoss()

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=1e-4,
)

for epoch in range(5):

    model.train()

    total_loss = 0

    for images, targets in loader:

        images = images.to(device)

        y = torch.stack([
            targets["calories"],
            targets["protein"],
            targets["carbs"],
            targets["fat"],
        ], dim=1).float().to(device)

        predictions = model(images)

        loss = criterion(
            predictions,
            y,
        )

        optimizer.zero_grad()

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    print(
        f"Epoch {epoch+1}: {total_loss:.2f}"
    )

Path("models").mkdir(exist_ok=True)

torch.save(
    model.state_dict(),
    "models/calorie_model.pt",
)

print("Saved model.")
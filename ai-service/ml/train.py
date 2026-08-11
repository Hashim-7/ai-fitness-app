from pathlib import Path

import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
from torchvision import transforms

from ml.datasets.nutrition_dataset import Nutrition5kDataset
from ml.models.calorie_model import CalorieModel


device = torch.device(
    "mps"
    if torch.backends.mps.is_available()
    else "cpu"
)

print(f"Device: {device}")


transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


dataset = Nutrition5kDataset(
    metadata_file="datasets/metadata/dish_metadata_cafe1.csv",
    image_dir="datasets/sample_images/realsense_overhead",
    transform=transform,
)


train_size = int(len(dataset) * 0.8)
val_size = len(dataset) - train_size

train_dataset, val_dataset = random_split(
    dataset,
    [train_size, val_size],
)


train_loader = DataLoader(
    train_dataset,
    batch_size=16,
    shuffle=True,
)


val_loader = DataLoader(
    val_dataset,
    batch_size=16,
)


model = CalorieModel().to(device)

criterion = nn.MSELoss()

optimizer = torch.optim.Adam(
    model.backbone.fc.parameters(),
    lr=1e-3,
)


best_val_loss = float("inf")

Path("models").mkdir(exist_ok=True)


for epoch in range(30):

    # -----------------
    # Training
    # -----------------

    model.train()

    train_loss = 0.0

    for images, targets in train_loader:

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

        train_loss += loss.item()


    # -----------------
    # Validation
    # -----------------

    model.eval()

    val_loss = 0.0

    with torch.no_grad():

        for images, targets in val_loader:

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

            val_loss += loss.item()


    train_loss /= len(train_loader)
    val_loss /= len(val_loader)


    print(
        f"Epoch {epoch + 1:02d}/30 "
        f"| train: {train_loss:.2f} "
        f"| val: {val_loss:.2f}"
    )


    if val_loss < best_val_loss:

        best_val_loss = val_loss

        torch.save(
            model.state_dict(),
            "models/calorie_model.pt",
        )

        print("  → saved best model")


print("Training complete.")
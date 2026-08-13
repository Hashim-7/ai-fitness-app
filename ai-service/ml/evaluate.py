import torch
from torch.utils.data import DataLoader, random_split
from torchvision import transforms

from ml.datasets.nutrition_dataset import Nutrition5kDataset
from ml.models.calorie_model import CalorieModel


device = torch.device(
    "mps"
    if torch.backends.mps.is_available()
    else "cpu"
)


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

_, val_dataset = random_split(
    dataset,
    [train_size, val_size],
    generator=torch.Generator().manual_seed(42),
)


loader = DataLoader(
    val_dataset,
    batch_size=16,
)


model = CalorieModel().to(device)

model.load_state_dict(
    torch.load(
        "models/calorie_model.pt",
        map_location=device,
    )
)

model.eval()


total_error = torch.zeros(4)
count = 0


with torch.no_grad():

    for images, targets in loader:

        images = images.to(device)

        y = torch.stack([
            targets["calories"],
            targets["protein"],
            targets["carbs"],
            targets["fat"],
        ], dim=1).float()

        predictions = model(images).cpu()

        total_error += torch.abs(
            predictions - y
        ).sum(dim=0)

        count += images.size(0)


mae = total_error / count


print()
print("Validation MAE")
print("----------------")
print(f"Calories: {mae[0]:.2f} kcal")
print(f"Protein:  {mae[1]:.2f} g")
print(f"Carbs:    {mae[2]:.2f} g")
print(f"Fat:      {mae[3]:.2f} g")
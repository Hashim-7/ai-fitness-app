from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms

from ml.models.calorie_model import CalorieModel


MODEL_PATH = Path("models/calorie_model.pt")


device = torch.device(
    "mps"
    if torch.backends.mps.is_available()
    else "cpu"
)


transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])


def load_model():

    model = CalorieModel()

    model.load_state_dict(
        torch.load(
            MODEL_PATH,
            map_location=device,
        )
    )

    model.to(device)

    model.eval()

    return model


model = load_model()

VALIDATION_MAE = {
    "calories": 131.53,
    "protein": 9.10,
    "carbs": 8.91,
    "fat": 6.61,
}


def calculate_confidence(calories, protein, carbs, fat):
    errors = [
        VALIDATION_MAE["calories"] / max(calories, 1.0),
        VALIDATION_MAE["protein"] / max(protein, 1.0),
        VALIDATION_MAE["carbs"] / max(carbs, 1.0),
        VALIDATION_MAE["fat"] / max(fat, 1.0),
    ]

    relative_error = sum(errors) / len(errors)

    confidence = 1.0 / (1.0 + relative_error)

    return round(
        max(0.0, min(1.0, confidence)),
        2,
    )

def predict(image_path: str, model=None):

    if model is None:
        model = load_model()

    image = Image.open(
        image_path
    ).convert("RGB")


    image = transform(image)

    image = image.unsqueeze(0)

    model_device = next(model.parameters()).device
    image = image.to(model_device)


    with torch.no_grad():

        prediction = model(image)


    prediction = prediction.cpu().numpy()[0]


    calories = max(0, float(prediction[0]))
    protein = max(0, float(prediction[1]))
    carbs = max(0, float(prediction[2]))
    fat = max(0, float(prediction[3]))

    confidence = calculate_confidence(
    calories,
    protein,
    carbs,
    fat,
)


    return {
        "calories": round(calories, 2),
        "protein": round(protein, 2),
        "carbs": round(carbs, 2),
        "fat": round(fat, 2),
        "confidence": confidence,
    }

if __name__ == "__main__":

    result = predict(
        "datasets/sample_images/realsense_overhead/dish_1561662458/rgb.png"
    )

    print(result)
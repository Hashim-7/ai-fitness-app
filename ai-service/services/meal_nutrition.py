from pathlib import Path

from ml.inference import predict
from services.food_identifier import food_identifier as default_food_identifier


def analyse_meal(
    image_path: Path,
    food_identifier=None,
):
    if food_identifier is None:
        food_identifier = default_food_identifier

    foods = food_identifier.identify(image_path)

    nutrition = predict(str(image_path))

    items = [
        {
            "name": food["name"],
            "confidence": food["confidence"],
        }
        for food in foods
    ]

    return {
        "items": items,
        "calories": nutrition["calories"],
        "protein": nutrition["protein"],
        "carbs": nutrition["carbs"],
        "fat": nutrition["fat"],
    }

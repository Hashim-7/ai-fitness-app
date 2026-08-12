from pathlib import Path

from services.food_identifier import food_identifier
from services.food_nutrition import estimate_food_nutrition
from services.nutrition import get_nutrition_db
from services.portion_estimator import portion_estimator as default_portion_estimator


def analyse_meal(
    image_path: Path,
    database=None,
    portion_estimator=None,
):

    if database is None:
        database = get_nutrition_db()

    if portion_estimator is None:
        portion_estimator = default_portion_estimator

    foods = food_identifier.identify(image_path)

    items = []

    for food in foods:

        estimated_grams = portion_estimator.estimate(
            image_path
        )

        nutrition = estimate_food_nutrition(
            food["name"],
            estimated_grams,
            database=database,
        )

        if nutrition is None:
            continue

        nutrition["confidence"] = food["confidence"]

        items.append(nutrition)

    return items
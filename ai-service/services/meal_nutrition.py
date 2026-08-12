from services.food_identifier import food_identifier
from services.food_nutrition import estimate_food_nutrition


def analyse_meal(image_path):

    foods = food_identifier.identify(image_path)

    items = []

    for food in foods:

        nutrition = estimate_food_nutrition(
            food["name"],
            100,  # temporary serving size
        )

        if nutrition is None:
            continue

        nutrition["confidence"] = food["confidence"]

        items.append(nutrition)

    return items

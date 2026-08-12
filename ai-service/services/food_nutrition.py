from services.nutrition import nutrition_db


def estimate_food_nutrition(
    food_name: str,
    estimated_grams: float,
):
    nutrition = nutrition_db.lookup(food_name)

    if nutrition is None:
        return None

    return {
        "name": food_name,
        "estimated_grams": estimated_grams,
        "calories": round(
            nutrition["calories_per_g"] * estimated_grams,
            2,
        ),
        "protein": round(
            nutrition["protein_per_g"] * estimated_grams,
            2,
        ),
        "carbs": round(
            nutrition["carbs_per_g"] * estimated_grams,
            2,
        ),
        "fat": round(
            nutrition["fat_per_g"] * estimated_grams,
            2,
        ),
    }
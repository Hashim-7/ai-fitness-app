import csv
from pathlib import Path


DEFAULT_NUTRITION_FILE = Path(
    "datasets/metadata/ingredients_metadata.csv"
)


class NutritionDatabase:

    def __init__(self, nutrition_file):

        self.foods = {}

        with open(nutrition_file, newline="") as f:
            reader = csv.DictReader(f)

            for row in reader:
                name = row["ingr"].strip().lower()

                self.foods[name] = {
                    "calories_per_g": float(row["cal/g"]),
                    "fat_per_g": float(row["fat(g)"]),
                    "carbs_per_g": float(row["carb(g)"]),
                    "protein_per_g": float(row["protein(g)"]),
                }

    def lookup(self, food_name: str):
        return self.foods.get(food_name.lower())


def get_nutrition_db():
    return NutritionDatabase(DEFAULT_NUTRITION_FILE)
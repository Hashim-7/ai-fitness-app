import csv
from collections import Counter
from pathlib import Path


MIN_EXAMPLES = 20


def load_ingredient_counts(
    metadata_path: Path,
    image_root: Path | None = None,
):
    counts = Counter()

    with open(metadata_path, newline="") as file:
        reader = csv.reader(file)

        for row in reader:
            if not row:
                continue

            dish_id = row[0]

            if image_root is not None:
                image_path = (
                    image_root
                    / dish_id
                    / "rgb.png"
                )

                if not image_path.exists():
                    continue

            values = row[6:]
            ingredients_in_dish = set()

            for i in range(0, len(values), 7):

                if i + 1 >= len(values):
                    continue

                ingredient = values[i + 1].strip()

                if ingredient:
                    ingredients_in_dish.add(ingredient)

            for ingredient in ingredients_in_dish:
                counts[ingredient] += 1

    return counts


def build_ingredient_to_index(
    metadata_path: Path,
    image_root: Path | None = None,
    min_examples: int = MIN_EXAMPLES,
):
    counts = load_ingredient_counts(
        metadata_path,
        image_root=image_root,
    )

    ingredients = sorted(
        ingredient
        for ingredient, count in counts.items()
        if count >= min_examples
    )

    return {
        ingredient: index
        for index, ingredient in enumerate(ingredients)
    }
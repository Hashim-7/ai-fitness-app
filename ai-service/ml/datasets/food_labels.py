import csv
from collections import Counter
from pathlib import Path


MIN_EXAMPLES = 20


def load_ingredient_counts(metadata_path: Path):
    counts = Counter()

    with open(metadata_path, newline="") as file:
        reader = csv.reader(file)

        for row in reader:
            if not row:
                continue

            values = row[6:]

            for i in range(0, len(values), 7):

                if i + 1 >= len(values):
                    continue

                ingredient = values[i + 1].strip()

                if ingredient:
                    counts[ingredient] += 1

    return counts


def build_ingredient_to_index(
    metadata_path: Path,
    min_examples: int = MIN_EXAMPLES,
):
    counts = load_ingredient_counts(metadata_path)

    ingredients = sorted(
        ingredient
        for ingredient, count in counts.items()
        if count >= min_examples
    )

    return {
        ingredient: index
        for index, ingredient in enumerate(ingredients)
    }
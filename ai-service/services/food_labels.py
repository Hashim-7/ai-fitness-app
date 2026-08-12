import csv
from pathlib import Path


METADATA_PATH = Path(
    "datasets/metadata/ingredients_metadata.csv"
)


def load_food_labels():
    labels = []

    with open(METADATA_PATH, newline="") as f:
        reader = csv.DictReader(f)

        for row in reader:
            labels.append(row["ingr"])

    return labels
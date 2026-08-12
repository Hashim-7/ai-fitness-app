import csv
from pathlib import Path


DEFAULT_METADATA_PATH = Path(
    "datasets/metadata/dish_metadata_cafe1.csv"
)


class PortionEstimator:

    def __init__(
        self,
        metadata_path: Path = DEFAULT_METADATA_PATH,
    ):
        self.metadata_path = metadata_path

    def estimate(self, image_path: Path) -> float:

        dish_id = image_path.parent.name

        with open(self.metadata_path, newline="") as file:
            reader = csv.reader(file)

            for row in reader:

                if not row:
                    continue

                if row[0] != dish_id:
                    continue

                # Nutrition5k:
                # dish_id, calories, mass, fat, carbs, protein, ...

                return float(row[2])

        raise ValueError(
            f"No portion metadata found for dish: {dish_id}"
        )


portion_estimator = PortionEstimator()
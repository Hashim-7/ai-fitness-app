from collections import Counter
from pathlib import Path

from ml.datasets.food_dataset import FoodDataset
from ml.datasets.food_labels import build_ingredient_to_index


METADATA_PATH = Path(
    "datasets/metadata/dish_metadata_cafe1.csv"
)

IMAGE_ROOT = Path(
    "datasets/sample_images/realsense_overhead"
)


def main():

    ingredient_to_index = build_ingredient_to_index(
        METADATA_PATH,
        image_root=IMAGE_ROOT,
        min_examples=20,
    )

    dataset = FoodDataset(
        image_root=IMAGE_ROOT,
        metadata_path=METADATA_PATH,
        ingredient_to_index=ingredient_to_index,
    )

    index_to_ingredient = {
        index: name
        for name, index in ingredient_to_index.items()
    }

    counts = Counter()

    for _, labels in dataset.samples:

        for label in labels:
            counts[label] += 1

    print(f"Classes: {len(ingredient_to_index)}")
    print(f"Images: {len(dataset)}")
    print()

    print("Class distribution")
    print(
        "Class                          Images"
    )
    print(
        "-----------------------------  ------"
    )

    for index, count in sorted(
        counts.items(),
        key=lambda item: item[1],
    ):

        print(
            f"{index_to_ingredient[index]:<29} "
            f"{count:>6}"
        )

    print()

    print("Summary")

    values = list(counts.values())

    print("Minimum:", min(values))
    print("Maximum:", max(values))
    print(
        "Average:",
        round(sum(values) / len(values), 2),
    )

    print()

    print("Classes with fewer than 20 images:")

    for index, count in sorted(
        counts.items(),
        key=lambda item: item[1],
    ):

        if count < 20:

            print(
                f"{count:>4}  "
                f"{index_to_ingredient[index]}"
            )


if __name__ == "__main__":
    main()
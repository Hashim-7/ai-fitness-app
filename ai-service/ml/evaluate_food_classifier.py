from pathlib import Path

import torch
from torch.utils.data import DataLoader, random_split

from ml.datasets.food_dataset import FoodDataset
from ml.models.food_classifier import FoodClassifier


METADATA_PATH = Path(
    "datasets/metadata/dish_metadata_cafe1.csv"
)

IMAGE_ROOT = Path(
    "datasets/sample_images/realsense_overhead"
)

MODEL_PATH = Path(
    "models/food_classifier.pt"
)

BATCH_SIZE = 32
VALIDATION_SPLIT = 0.2
SEED = 42

THRESHOLDS = [
    0.1,
    0.2,
    0.3,
    0.4,
    0.5,
    0.6,
    0.7,
]


def main():

    checkpoint = torch.load(
        MODEL_PATH,
        map_location="cpu",
    )

    ingredient_to_index = checkpoint[
        "ingredient_to_index"
    ]

    dataset = FoodDataset(
        image_root=IMAGE_ROOT,
        metadata_path=METADATA_PATH,
        ingredient_to_index=ingredient_to_index,
    )

    validation_size = int(
        len(dataset) * VALIDATION_SPLIT
    )

    training_size = len(dataset) - validation_size

    generator = torch.Generator().manual_seed(SEED)

    _, validation_dataset = random_split(
        dataset,
        [training_size, validation_size],
        generator=generator,
    )

    validation_loader = DataLoader(
        validation_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=0,
    )

    model = FoodClassifier(
        num_classes=len(ingredient_to_index)
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.eval()

    all_probabilities = []
    all_targets = []

    with torch.no_grad():

        for images, targets in validation_loader:

            logits = model(images)

            probabilities = torch.sigmoid(logits)

            all_probabilities.append(
                probabilities
            )

            all_targets.append(targets)

    probabilities = torch.cat(
        all_probabilities
    )

    targets = torch.cat(
        all_targets
    )

    print(
        f"Validation images: {len(validation_dataset)}"
    )

    print(
        f"Number of classes: {len(ingredient_to_index)}"
    )

    print()

    print(
        "Threshold | Precision | Recall | F1"
    )

    print(
        "----------|-----------|--------|------"
    )

    for threshold in THRESHOLDS:

        predictions = (
            probabilities >= threshold
        ).float()

        true_positives = (
            predictions * targets
        ).sum().item()

        predicted_labels = (
            predictions.sum().item()
        )

        total_labels = (
            targets.sum().item()
        )

        precision = (
            true_positives / predicted_labels
            if predicted_labels
            else 0.0
        )

        recall = (
            true_positives / total_labels
            if total_labels
            else 0.0
        )

        f1 = (
            2 * precision * recall
            / (precision + recall)
            if precision + recall
            else 0.0
        )

        print(
            f"{threshold:9.1f} | "
            f"{precision:9.4f} | "
            f"{recall:6.4f} | "
            f"{f1:4.4f}"
        )


if __name__ == "__main__":
    main()
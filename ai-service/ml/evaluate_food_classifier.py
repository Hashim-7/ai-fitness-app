from pathlib import Path

import torch
from torch.utils.data import DataLoader, random_split

from ml.datasets.food_dataset import FoodDataset
from ml.datasets.food_labels import build_ingredient_to_index
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
THRESHOLD = 0.5


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

    total_labels = 0
    true_positives = 0
    predicted_labels = 0

    with torch.no_grad():

        for images, targets in validation_loader:

            logits = model(images)

            probabilities = torch.sigmoid(logits)

            predictions = (
                probabilities >= THRESHOLD
            ).float()

            true_positives += (
                predictions * targets
            ).sum().item()

            predicted_labels += (
                predictions.sum().item()
            )

            total_labels += targets.sum().item()

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
        2 * precision * recall / (precision + recall)
        if precision + recall
        else 0.0
    )

    print(
        f"Validation precision: {precision:.4f}"
    )

    print(
        f"Validation recall:    {recall:.4f}"
    )

    print(
        f"Validation F1:         {f1:.4f}"
    )


if __name__ == "__main__":
    main()
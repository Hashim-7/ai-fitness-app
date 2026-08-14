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
    "models/food_classifier_weighted.pt"
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

SELECTED_THRESHOLD = 0.5


def calculate_metrics(predictions, targets):
    true_positives = (predictions * targets).sum(dim=0)
    predicted = predictions.sum(dim=0)
    actual = targets.sum(dim=0)

    precision = torch.where(
        predicted > 0,
        true_positives / predicted,
        torch.zeros_like(predicted),
    )

    recall = torch.where(
        actual > 0,
        true_positives / actual,
        torch.zeros_like(actual),
    )

    f1 = torch.where(
        precision + recall > 0,
        2 * precision * recall / (precision + recall),
        torch.zeros_like(precision),
    )

    return precision, recall, f1, actual


def main():

    checkpoint = torch.load(
        MODEL_PATH,
        map_location="cpu",
    )

    ingredient_to_index = checkpoint[
        "ingredient_to_index"
    ]

    index_to_ingredient = {
        index: name
        for name, index in ingredient_to_index.items()
    }

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

            all_probabilities.append(probabilities)
            all_targets.append(targets)

    probabilities = torch.cat(all_probabilities)
    targets = torch.cat(all_targets)

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

        predicted_labels = predictions.sum().item()
        actual_labels = targets.sum().item()

        precision = (
            true_positives / predicted_labels
            if predicted_labels
            else 0.0
        )

        recall = (
            true_positives / actual_labels
            if actual_labels
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
            f"{f1:.4f}"
        )

    print()
    print(
        f"Per-class metrics at threshold {SELECTED_THRESHOLD}"
    )

    predictions = (
        probabilities >= SELECTED_THRESHOLD
    ).float()

    precision, recall, f1, support = calculate_metrics(
        predictions,
        targets,
    )

    class_metrics = []

    for index in range(len(index_to_ingredient)):

        class_metrics.append(
            {
                "name": index_to_ingredient[index],
                "support": int(support[index].item()),
                "precision": precision[index].item(),
                "recall": recall[index].item(),
                "f1": f1[index].item(),
            }
        )

    print()
    print("Worst 20 classes by F1")
    print(
        "Class                          Support   "
        "Precision   Recall      F1"
    )
    print(
        "-----------------------------  -------   "
        "---------   ------   ------"
    )

    for item in sorted(
        class_metrics,
        key=lambda x: x["f1"],
    )[:20]:

        print(
            f"{item['name']:<29} "
            f"{item['support']:>7}   "
            f"{item['precision']:>9.4f}   "
            f"{item['recall']:>6.4f}   "
            f"{item['f1']:>6.4f}"
        )

    print()
    print("Best 20 classes by F1")
    print(
        "Class                          Support   "
        "Precision   Recall      F1"
    )
    print(
        "-----------------------------  -------   "
        "---------   ------   ------"
    )

    for item in sorted(
        class_metrics,
        key=lambda x: x["f1"],
        reverse=True,
    )[:20]:

        print(
            f"{item['name']:<29} "
            f"{item['support']:>7}   "
            f"{item['precision']:>9.4f}   "
            f"{item['recall']:>6.4f}   "
            f"{item['f1']:>6.4f}"
        )


if __name__ == "__main__":
    main()
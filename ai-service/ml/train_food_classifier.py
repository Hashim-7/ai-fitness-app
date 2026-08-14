from pathlib import Path

import torch
from torch import nn
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

MODEL_OUTPUT = Path(
    "models/food_classifier_weighted.pt"
)

BATCH_SIZE = 32
EPOCHS = 5
LEARNING_RATE = 1e-4
VALIDATION_SPLIT = 0.2
SEED = 42


def main():

    torch.manual_seed(SEED)

    ingredient_to_index = build_ingredient_to_index(
        METADATA_PATH,
        image_root=IMAGE_ROOT,
        min_examples=20,
    )

    print(
        f"Using {len(ingredient_to_index)} food classes"
    )

    dataset = FoodDataset(
        image_root=IMAGE_ROOT,
        metadata_path=METADATA_PATH,
        ingredient_to_index=ingredient_to_index,
    )

    print(
        f"Using {len(dataset)} training images"
    )

    validation_size = int(
        len(dataset) * VALIDATION_SPLIT
    )

    training_size = len(dataset) - validation_size

    generator = torch.Generator().manual_seed(SEED)

    train_dataset, validation_dataset = random_split(
        dataset,
        [training_size, validation_size],
        generator=generator,
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=0,
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

    device = torch.device(
        "cuda"
        if torch.cuda.is_available()
        else "cpu"
    )

    model.to(device)

    class_counts = torch.zeros(
        len(ingredient_to_index),
        dtype=torch.float32,
    )

    for _, labels in dataset.samples:
        for label in labels:
            class_counts[label] += 1

    total_images = len(dataset)

    negative_counts = (
        total_images - class_counts
    )

    positive_weights = torch.sqrt(
        negative_counts / class_counts
    )

    criterion = nn.BCEWithLogitsLoss(
        pos_weight=positive_weights.to(device)
    )

    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=LEARNING_RATE,
    )

    for epoch in range(EPOCHS):

        model.train()

        training_loss = 0.0

        for images, targets in train_loader:

            images = images.to(device)
            targets = targets.to(device)

            optimizer.zero_grad()

            outputs = model(images)

            loss = criterion(
                outputs,
                targets,
            )

            loss.backward()
            optimizer.step()

            training_loss += loss.item()

        training_loss /= len(train_loader)

        model.eval()

        validation_loss = 0.0

        with torch.no_grad():

            for images, targets in validation_loader:

                images = images.to(device)
                targets = targets.to(device)

                outputs = model(images)

                loss = criterion(
                    outputs,
                    targets,
                )

                validation_loss += loss.item()

        validation_loss /= len(validation_loader)

        print(
            f"Epoch {epoch + 1}/{EPOCHS} "
            f"- train loss: {training_loss:.4f} "
            f"- val loss: {validation_loss:.4f}"
        )

    MODEL_OUTPUT.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "ingredient_to_index": ingredient_to_index,
        },
        MODEL_OUTPUT,
    )

    print(
        f"Saved model to {MODEL_OUTPUT}"
    )


if __name__ == "__main__":
    main()
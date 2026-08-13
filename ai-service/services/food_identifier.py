from pathlib import Path

import torch
from PIL import Image
from torchvision import transforms

from ml.models.food_classifier import FoodClassifier


DEFAULT_MODEL_PATH = Path(
    "models/food_classifier.pt"
)


class FoodIdentifier:

    def __init__(
        self,
        model_path: Path = DEFAULT_MODEL_PATH,
        threshold: float = 0.5,
    ):
        self.model_path = Path(model_path)
        self.threshold = threshold

        self.device = torch.device("cpu")

        checkpoint = torch.load(
            self.model_path,
            map_location=self.device,
        )

        self.ingredient_to_index = checkpoint[
            "ingredient_to_index"
        ]

        self.index_to_ingredient = {
            index: name
            for name, index
            in self.ingredient_to_index.items()
        }

        self.model = FoodClassifier(
            num_classes=len(self.ingredient_to_index)
        )

        self.model.load_state_dict(
            checkpoint["model_state_dict"]
        )

        self.model.to(self.device)
        self.model.eval()

        self.transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ]
        )

    def identify(self, image_path: Path):

        image = Image.open(image_path).convert("RGB")

        image = self.transform(image)

        image = image.unsqueeze(0).to(self.device)

        with torch.no_grad():

            logits = self.model(image)

            probabilities = torch.sigmoid(logits)[0]

        results = []

        for index, probability in enumerate(
            probabilities
        ):

            confidence = probability.item()

            if confidence >= self.threshold:

                results.append(
                    {
                        "name": self.index_to_ingredient[
                            index
                        ],
                        "confidence": round(
                            confidence,
                            4,
                        ),
                    }
                )

        results.sort(
            key=lambda item: item["confidence"],
            reverse=True,
        )

        return results


food_identifier = FoodIdentifier()
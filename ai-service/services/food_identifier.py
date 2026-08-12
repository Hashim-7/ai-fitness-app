from pathlib import Path


class FoodIdentifier:

    def identify(self, image_path: Path):
        """
        Temporary food identification implementation.

        This interface will later be backed by a food
        vision model or vision-language model.
        """

        return [
            {
                "name": "cottage cheese",
                "confidence": 0.5,
            }
        ]


food_identifier = FoodIdentifier()

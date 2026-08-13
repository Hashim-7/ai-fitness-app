import torch

from ml.models.food_classifier import FoodClassifier


def test_food_classifier_output_shape():

    model = FoodClassifier(num_classes=10)

    images = torch.randn(2, 3, 224, 224)

    output = model(images)

    assert output.shape == (2, 10)


def test_food_classifier_output_is_finite():

    model = FoodClassifier(num_classes=10)

    images = torch.randn(2, 3, 224, 224)

    output = model(images)

    assert torch.isfinite(output).all()
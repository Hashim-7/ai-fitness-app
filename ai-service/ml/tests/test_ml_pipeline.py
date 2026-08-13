import torch

from ml.models.calorie_model import CalorieModel


def test_model_output_shape():
    model = CalorieModel()
    model.eval()

    x = torch.randn(2, 3, 224, 224)

    with torch.no_grad():
        y = model(x)

    assert y.shape == (2, 4)


def test_model_output_is_finite():
    model = CalorieModel()
    model.eval()

    x = torch.randn(1, 3, 224, 224)

    with torch.no_grad():
        y = model(x)

    assert torch.isfinite(y).all()


def test_model_output_has_four_nutrition_values():
    model = CalorieModel()

    x = torch.randn(1, 3, 224, 224)

    with torch.no_grad():
        y = model(x)

    calories, protein, carbs, fat = y[0]

    assert calories.numel() == 1
    assert protein.numel() == 1
    assert carbs.numel() == 1
    assert fat.numel() == 1
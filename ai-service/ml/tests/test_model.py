import torch

from ml.models.calorie_model import CalorieModel


def test_model_output_shape():

    model = CalorieModel()

    model.eval()

    x = torch.randn(2, 3, 224, 224)

    with torch.no_grad():
        y = model(x)

    assert y.shape == (2, 4)
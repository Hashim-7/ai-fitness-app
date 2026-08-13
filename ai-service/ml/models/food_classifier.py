import torch
from torch import nn
from torchvision import models


class FoodClassifier(nn.Module):

    def __init__(self, num_classes: int):
        super().__init__()

        self.model = models.resnet18(
            weights=models.ResNet18_Weights.DEFAULT
        )

        in_features = self.model.fc.in_features

        self.model.fc = nn.Linear(
            in_features,
            num_classes,
        )

    def forward(self, x):
        return self.model(x)
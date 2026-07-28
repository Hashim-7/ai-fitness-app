import torch.nn as nn
from torchvision.models import resnet18


class CalorieModel(nn.Module):
    def __init__(self):
        super().__init__()

        self.backbone = resnet18(weights="DEFAULT")

        in_features = self.backbone.fc.in_features

        self.backbone.fc = nn.Linear(
            in_features,
            4,
        )

    def forward(self, x):
        return self.backbone(x)
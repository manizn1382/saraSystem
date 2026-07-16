from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
import torchvision.transforms as transforms


BASE_DIR = Path(__file__).resolve().parent
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES = ["id", "no_id"]

transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor()
])

_encoder = None
_classifier = None


class Autoencoder(nn.Module):
    def __init__(self):
        super().__init__()

        self.encoder = nn.Sequential(
            nn.Conv2d(3, 16, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 32, 3, stride=2, padding=1),
            nn.ReLU(),
            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.ReLU()
        )

        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(64, 32, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(32, 16, 3, stride=2, padding=1, output_padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(16, 3, 3, stride=2, padding=1, output_padding=1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.decoder(self.encoder(x))


class Classifier(nn.Module):
    def __init__(self):
        super().__init__()

        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 8 * 8, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 2)
        )

    def forward(self, x):
        return self.fc(x)


def _load_models():
    global _encoder, _classifier
    if _encoder is not None and _classifier is not None:
        return _encoder, _classifier

    autoencoder = Autoencoder().to(DEVICE)
    autoencoder.load_state_dict(torch.load(BASE_DIR / "autoencoder.pth", map_location=DEVICE))
    _encoder = autoencoder.encoder
    _encoder.eval()

    _classifier = Classifier().to(DEVICE)
    _classifier.load_state_dict(torch.load(BASE_DIR / "classifier.pth", map_location=DEVICE))
    _classifier.eval()

    return _encoder, _classifier


def contains_id_card(image_path):
    encoder, classifier = _load_models()
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        features = encoder(image)
        output = classifier(features)
        pred = output.argmax(1).item()

    return CLASSES[pred] == "id"

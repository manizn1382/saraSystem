import torch
import torch.nn as nn
from PIL import Image
import torchvision.transforms as transforms

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor()
])

# -----------------------
# Autoencoder
# -----------------------
class Autoencoder(nn.Module):
    def __init__(self):
        super().__init__()

        self.encoder = nn.Sequential(
            nn.Conv2d(3,16,3,stride=2,padding=1),
            nn.ReLU(),
            nn.Conv2d(16,32,3,stride=2,padding=1),
            nn.ReLU(),
            nn.Conv2d(32,64,3,stride=2,padding=1),
            nn.ReLU()
        )

        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(64,32,3,stride=2,padding=1,output_padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(32,16,3,stride=2,padding=1,output_padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(16,3,3,stride=2,padding=1,output_padding=1),
            nn.Sigmoid()
        )

    def forward(self,x):
        return self.decoder(self.encoder(x))

# -----------------------
# Classifier
# -----------------------
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

    def forward(self,x):
        return self.fc(x)

# -----------------------
# Load Models
# -----------------------
autoencoder = Autoencoder().to(DEVICE)
autoencoder.load_state_dict(torch.load("autoencoder.pth", map_location=DEVICE))
encoder = autoencoder.encoder
encoder.eval()

classifier = Classifier().to(DEVICE)
classifier.load_state_dict(torch.load("classifier.pth", map_location=DEVICE))
classifier.eval()

classes = ["id", "no_id"]


def contains_id_card(image_path):
    image = Image.open(image_path).convert("RGB")
    image = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        features = encoder(image)
        output = classifier(features)
        pred = output.argmax(1).item()

    # ImageFolder sorts class names alphabetically.
    # If your classes are ['id', 'no_id'], then:
    return pred == 0



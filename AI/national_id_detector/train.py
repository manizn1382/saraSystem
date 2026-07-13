import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader

# ==========================
# Settings
# ==========================
DEVICE = torch.device("cpu")

TRAIN_PATH = "dataset/train"
VAL_PATH = "dataset/val"

BATCH_SIZE = 32
EPOCHS = 20
LR = 0.001

# ==========================
# Dataset
# ==========================
transform = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor()
])

train_dataset = torchvision.datasets.ImageFolder(TRAIN_PATH, transform=transform)
val_dataset = torchvision.datasets.ImageFolder(VAL_PATH, transform=transform)

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

print(train_dataset.classes)   # ['id', 'no_id']

# ==========================
# Autoencoder
# ==========================
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

# ==========================
# Load encoder
# ==========================
autoencoder = Autoencoder().to(DEVICE)
autoencoder.load_state_dict(torch.load("autoencoder.pth", map_location=DEVICE))

encoder = autoencoder.encoder

for p in encoder.parameters():
    p.requires_grad = False

encoder.eval()

# ==========================
# Classifier
# ==========================
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

classifier = Classifier().to(DEVICE)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(classifier.parameters(), lr=LR)

best_acc = 0

# ==========================
# Training
# ==========================
for epoch in range(EPOCHS):

    classifier.train()

    for images, labels in train_loader:

        images = images.to(DEVICE)
        labels = labels.to(DEVICE)

        with torch.no_grad():
            features = encoder(images)

        outputs = classifier(features)

        loss = criterion(outputs, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    # Validation
    classifier.eval()

    correct = 0
    total = 0

    with torch.no_grad():

        for images, labels in val_loader:

            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            features = encoder(images)

            outputs = classifier(features)

            pred = outputs.argmax(1)

            correct += (pred == labels).sum().item()
            total += labels.size(0)

    acc = 100 * correct / total

    print(f"Epoch {epoch+1}/{EPOCHS}  Validation Accuracy: {acc:.2f}%")

    if acc > best_acc:
        best_acc = acc
        torch.save(classifier.state_dict(), "classifier.pth")

print(f"\nBest Validation Accuracy: {best_acc:.2f}%")
print("classifier.pth saved.")
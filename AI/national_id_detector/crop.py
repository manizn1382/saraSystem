import cv2
import numpy as np


def order_points(pts):
    """Order points as: top-left, top-right, bottom-right, bottom-left"""
    rect = np.zeros((4, 2), dtype="float32")

    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]      # Top-left
    rect[2] = pts[np.argmax(s)]      # Bottom-right

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]   # Top-right
    rect[3] = pts[np.argmax(diff)]   # Bottom-left

    return rect


def four_point_transform(image, pts):
    rect = order_points(pts)
    (tl, tr, br, bl) = rect

    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    return warped


# -----------------------------
# Read image
# -----------------------------
image = cv2.imread("2.jpg")
orig = image.copy()

# Resize for faster processing
ratio = image.shape[0] / 800.0
image = cv2.resize(image, (int(image.shape[1] / ratio), 800))

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Blur
gray = cv2.GaussianBlur(gray, (5, 5), 0)

# Edge detection
edges = cv2.Canny(gray, 50, 150)

# Morphological closing
kernel = np.ones((5, 5), np.uint8)
edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

# Find contours
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

contours = sorted(contours, key=cv2.contourArea, reverse=True)

card = None

for cnt in contours:
    peri = cv2.arcLength(cnt, True)
    approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)

    if len(approx) == 4:
        card = approx
        break

if card is None:
    raise Exception("No ID card detected.")

# Scale contour back to original size
card = card.reshape(4, 2) * ratio

# Perspective transform
warped = four_point_transform(orig, card)

# Save result
cv2.imwrite("cropped_id_card.jpg", warped)

print("Saved: cropped_id_card.jpg")

# # Show
# cv2.imshow("Detected Card", warped)
# cv2.waitKey(0)
# cv2.destroyAllWindows()


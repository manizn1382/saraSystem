from pathlib import Path

import cv2
import numpy as np


def order_points(points):
    rect = np.zeros((4, 2), dtype="float32")

    coordinate_sum = points.sum(axis=1)
    rect[0] = points[np.argmin(coordinate_sum)]
    rect[2] = points[np.argmax(coordinate_sum)]

    coordinate_diff = np.diff(points, axis=1)
    rect[1] = points[np.argmin(coordinate_diff)]
    rect[3] = points[np.argmax(coordinate_diff)]

    return rect


def four_point_transform(image, points):
    rect = order_points(points)
    top_left, top_right, bottom_right, bottom_left = rect

    width_a = np.linalg.norm(bottom_right - bottom_left)
    width_b = np.linalg.norm(top_right - top_left)
    max_width = max(int(width_a), int(width_b))

    height_a = np.linalg.norm(top_right - bottom_right)
    height_b = np.linalg.norm(top_left - bottom_left)
    max_height = max(int(height_a), int(height_b))

    destination = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    matrix = cv2.getPerspectiveTransform(rect, destination)
    return cv2.warpPerspective(image, matrix, (max_width, max_height))


def crop_id_card(image_path, output_path):
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError("Could not read image.")

    original = image.copy()
    ratio = image.shape[0] / 800.0
    image = cv2.resize(image, (int(image.shape[1] / ratio), 800))

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(gray, 50, 150)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    card = None
    for contour in contours:
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
        if len(approx) == 4:
            card = approx
            break

    if card is None:
        raise ValueError("No ID card detected.")

    warped = four_point_transform(original, card.reshape(4, 2) * ratio)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output), warped)
    return output


def crop_id_part(
    image_path,
    output_path,
    x=1000,
    y=250,
    w=600,
    h=90,
    pad_x=25,
    pad_y=30
):
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError("Could not read image.")

    height, width = image.shape[:2]
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(width, x + w + pad_x)
    y2 = min(height, y + h + pad_y)

    cropped = image[y1:y2, x1:x2]
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output), cropped)
    return output

import re
import tempfile
from collections import Counter
from pathlib import Path

from ArabicOcr import arabicocr
from crop import crop_id_card, crop_id_part


def extract_text(image_path):
    with tempfile.TemporaryDirectory(prefix="sara_national_id_") as temp_dir:
        work_dir = Path(temp_dir)
        cropped_card = crop_id_card(image_path, work_dir / "cropped_id_card.jpg")
        cropped_part = crop_id_part(cropped_card, work_dir / "cropped_id_part.jpg")
        ocr_output = work_dir / "ocr_output.jpg"

        results = arabicocr.arabic_ocr(str(cropped_part), str(ocr_output))
        text = " ".join(result[1] for result in results)

    text = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
    text = text.replace("ه", "0")
    return re.sub(r"[^0-9]", "", text)


def is_match(expected, actual, threshold=0.7):
    expected = str(expected or "").replace("5", "0")
    actual = str(actual or "").replace("5", "0")

    expected_counts = Counter(expected)
    actual_counts = Counter(actual)
    chars = set(expected_counts) | set(actual_counts)
    total = sum(max(expected_counts[ch], actual_counts[ch]) for ch in chars)
    if total == 0:
        return False

    matched = sum(min(expected_counts[ch], actual_counts[ch]) for ch in chars)
    return matched / total >= threshold

from ArabicOcr import arabicocr
import re
from crop import *

def extract_text(img_path):

    crop_id_card(img_path)
    crop_id_part("cropped_id_card.jpg")

    results = arabicocr.arabic_ocr("cropped_id_part.jpg", "out.jpg")
    # OCR text
    text = " ".join(r[1] for r in results)

    # Arabic digits -> English digits
    text = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))

    # Replace Arabic ه with English 0
    text = text.replace("ه", "0")

    # Keep only English digits
    text = re.sub(r"[^0-9]", "", text)

    return text

from collections import Counter

def is_match(s1, s2, threshold=0.7):
    # Treat 5 as 0
    s1 = s1.replace("5", "0")
    s2 = s2.replace("5", "0")

    c1 = Counter(s1)
    c2 = Counter(s2)

    chars = set(c1) | set(c2)
    matched = sum(min(c1[ch], c2[ch]) for ch in chars)
    total = sum(max(c1[ch], c2[ch]) for ch in chars)

    return matched / total >= threshold
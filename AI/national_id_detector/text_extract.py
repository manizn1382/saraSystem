from ArabicOcr import arabicocr
import re


def extract_text(img_path):
    
    results = arabicocr.arabic_ocr("cropped.jpg", "out.jpg")
    # OCR text
    text = " ".join(r[1] for r in results)

    # Arabic digits -> English digits
    text = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))

    # Replace Arabic ه with English 0
    text = text.replace("ه", "0")

    # Keep only English digits
    text = re.sub(r"[^0-9]", "", text)

    print(text)
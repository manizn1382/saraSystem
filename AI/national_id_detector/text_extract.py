import cv2
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

digit_map = str.maketrans(
    "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
    "01234567890123456789"
)

def extract_text(path):
    img = cv2.imread(path)

    # Scale up
    img = cv2.resize(img, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise
    gray = cv2.bilateralFilter(gray, 9, 75, 75)

    # Increase contrast
    gray = cv2.equalizeHist(gray)

    # Adaptive threshold
    # gray = cv2.adaptiveThreshold(
    #     gray,
    #     255,
    #     cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    #     cv2.THRESH_BINARY,
    #     31,
    #     15
    # )

    cv2.imwrite("tttt.jpg" , gray)

    config = r'--oem 1 --psm 11'

    text = pytesseract.image_to_string(
        gray,
        lang="fas",
        config=config
    )

    return text.translate(digit_map)

print(extract_text("temp.jpg"))
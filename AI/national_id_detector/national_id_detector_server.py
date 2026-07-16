from pathlib import Path
import tempfile

from flask import Flask, request

from predict import contains_id_card
from text_extract import extract_text, is_match


app = Flask(__name__)


@app.post("/verify")
def verify_national_id():
    image = request.files.get("image")
    national_id = request.form.get("id", "")

    if not image:
        return {"success": False, "log": "image is required."}, 400

    if not national_id:
        return {"success": False, "log": "id is required."}, 400

    with tempfile.TemporaryDirectory(prefix="sara_national_id_upload_") as temp_dir:
        image_path = Path(temp_dir) / "upload.jpg"
        image.save(image_path)

        if not contains_id_card(image_path):
            return {"success": False, "log": "no id_card detected from photo."}

        try:
            text = extract_text(image_path)
        except Exception:
            return {"success": False, "log": "failed to extract text from photo."}

    if is_match(str(national_id), text):
        return {"success": True, "log": "user successfully verified."}

    return {"success": False, "log": "id doesnt match."}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)

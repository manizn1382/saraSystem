from flask import Flask, request
import os
from predict import *
from text_extract import *

app = Flask(__name__)

@app.post("/verify")
def register():
    image = request.files["image"]
    user_id = request.form["id"]

    path = "temp.jpg"
    image.save(path)

    success = None
    log = None

    if contains_id_card(path):
        try:
            text = extract_text(path)
            if is_match(str(user_id) , text):
                success = True
                log = "user successfully verified."
            else:
                success = False
                log = "id doesnt match."

        except Exception:
            success = False
            log = "failed to extract text from photo."

    else:
        success = False
        log = "no id_card detected from photo."

    
    return {"success" : success,
            "log" : log}


app.run(host="0.0.0.0", port=5000)
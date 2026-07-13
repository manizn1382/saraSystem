from flask import Flask, request
import os
from face_recognition import *

app = Flask(__name__)

@app.post("/register")
def register():
    image = request.files["image"]
    user_id = request.form["id"]

    path = "temp.jpg"
    image.save(path)

    return {"success": save_to_database(path, user_id)}


@app.post("/verify")
def verify_route():
    image = request.files["image"]
    user_id = request.form["id"]

    path = "temp.jpg"
    image.save(path)

    return {"success": verify(path, user_id)}

@app.post("/delete")
def delete():
    user_id = request.form["id"]
    os.remove("database/" + str(user_id) + "/img.jpg")
    os.rmdir("database/" + str(user_id))
    return {"success" : True}

app.run(host="0.0.0.0", port=5000)
from flask import Flask, request
from flask_cors import CORS
import os
from face_recognition import *

app = Flask(__name__)
CORS(app)

@app.post("/register")
def register():
    image = request.files["image"]
    user_id = request.form["id"]

    path = "temp.jpg"
    image.save(path)

    success , log = save_to_database(path , user_id)

    return {"success" : success,
            "log" : log}


@app.post("/verify")
def verify_route():
    image = request.files["image"]
    user_id = request.form["id"]

    path = "temp.jpg"
    image.save(path)

    success , log = verify(path, user_id)

    return {"success" : success, 
            "log" : log}


@app.post("/delete")
def delete():
    user_id = request.form["id"]
    try:
        os.remove("database/" + str(user_id) + "/img.jpg")
        os.rmdir("database/" + str(user_id))
        return {"success" : True,
                "log" : "deleted successfully."}
    except Exception :
        return {"success" : False,
                "log" : "id not exists"}
        

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("FACE_SERVICE_PORT", "5000")))

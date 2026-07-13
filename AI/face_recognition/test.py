import requests

with open("elon.jpg", "rb") as f:
    r = requests.post(
        "http://127.0.0.1:5000/delete",
        # files={"image": f},
        data={"id": 22}
    )



print(r.json())
import requests

with open("steve.jpg", "rb") as f:
    r = requests.post(
        "http://127.0.0.1:5000/verify",
        files={"image": f},
        data={"id": 1}
    )

print(r.json())
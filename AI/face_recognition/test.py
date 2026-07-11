import requests

with open("elon.jpg", "rb") as f:
    r = requests.post(
        "http://127.0.0.1:5000/verify",
        files={"image": f},
        data={"id": 11}
    )

print(r.json())
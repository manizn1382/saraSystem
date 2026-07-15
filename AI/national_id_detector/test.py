import requests

with open("1.jpg", "rb") as f:
    r = requests.post(
        "http://127.0.0.1:5000/verify",
        files={"image": f},
        data={"id": 1234567890}
    )

print(r.json())
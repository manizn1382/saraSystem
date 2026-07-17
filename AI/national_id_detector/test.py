import requests

with open("not_id.jpg", "rb") as f:
    r = requests.post(
        "http://127.0.0.1:5001/verify",
        files={"image": f},
        data={"id": 4031313926}
    )

print(r.json())

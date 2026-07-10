from deepface import DeepFace

def face_check(img_path):

    try:
        faces = DeepFace.extract_faces(
            img_path=img_path,
            detector_backend="opencv",   # or "retinaface", "mtcnn", "ssd", "yolov8"
            enforce_detection=True
        )

        if len(faces) == 1:
            print(f"Face detected!")
            return True

        elif len(faces) > 0:
            print("more than 1 face detected.")
            return False
        
        else:
            print("No face detected.")
            return False

    except Exception:
        print("No face detected.")
        return False





# result: dict = DeepFace.verify(img1_path = "img1.jpg", img2_path = "img2.jpg")

# print(result)

# print('*' * 40)

# print(DeepFace.find(
#     img_path="img1.jpg",
#     db_path="database/"
# ))

# print('*' * 40)

# DeepFace.register(img = "img1.jpg")

# # perform exact search
# dfs = DeepFace.search(img = "img2.jpg")

# print(dfs)
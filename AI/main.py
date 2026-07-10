from deepface import DeepFace
import os
import shutil

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


def save_to_database(img_path , id):

    if not face_check(img_path):
        return False

    os.mkdir(f"database/{id}")

    # Source path
    source = img_path

    # Destination path
    destination = f"database/{id}/img.jpg"

    dest = shutil.copyfile(source, destination)
    return True


save_to_database("elon.jpg" , 11)

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
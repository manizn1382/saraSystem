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


def verify(img_path_1 , img_path_2):
    return DeepFace.verify(img1_path = img_path_1, img2_path = img_path_2)["verified"]


# save_to_database("elon.jpg" , 11)

print(verify("elon.jpg" , "elon2.jpg"))
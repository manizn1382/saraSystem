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
        return False , "no face recognized in picture or more than 1 face recognized in picture."

    try:
        os.mkdir(f"database/{id}")

    except Exception:
        return False , "user with this id already exists!"

    # Source path
    source = img_path

    # Destination path
    destination = f"database/{id}/img.jpg"

    dest = shutil.copyfile(source, destination)
    return True , "saved successfully."


def verify(img_path_1 , id):

    if not face_check(img_path_1):
        return False , "no face recognized in picture or more than 1 face recognized in picture."
    
    if not os.path.isdir(f"database/{id}"):
        return False , "id not found"


    return DeepFace.verify(img1_path = img_path_1, img2_path = f"database/{id}/img.jpg")["verified"] , "operation done."


save_to_database("steve.jpg" , 22)

# print(verify("steve2.jpg" , 11))
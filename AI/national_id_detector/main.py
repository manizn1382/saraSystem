import cv2
from ultralytics import YOLO
import numpy as np

def detect_id_card(image_path, model_path='yolov8n.pt'):
    
    model = YOLO(model_path)  
    
    image = cv2.imread(image_path)
    if image is None:
        return None, None
    
    original_height, original_width = image.shape[:2]
    
    results = model(image_path)[0]  
    
    boxes_info = []
    
    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())  
        
        confidence = float(box.conf[0])  
        class_id = int(box.cls[0])
        class_name = results.names[class_id]
        
        boxes_info.append({
            'class_name': class_name,
            'confidence': confidence,
            'coordinates': (x1, y1, x2, y2)
        })
        
        cropped_card = image[y1:y2, x1:x2]
        
        return cropped_card, (x1, y1, x2, y2)
    
    if not boxes_info:
        print("no object found!")
        return None, None
    
    return None, None

def draw_detection(image_path, output_path='output_with_box.jpg'):

    cropped_card, coords = detect_id_card(image_path)
    
    if cropped_card is None:
        return
    
    image = cv2.imread(image_path)
    x1, y1, x2, y2 = coords
    
    cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 3)

    cv2.putText(image, 'ID Card Detected', (x1, y1-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    cv2.imwrite(output_path, image)
    print(f"image saved")
    
    return image

if __name__ == "__main__":
    
    image_path = "125.jpg"
    
    cropped_card, coordinates = detect_id_card(image_path)
    
    if cropped_card is not None:
        cv2.imwrite("cropped_card.jpg", cropped_card)
    
    result_image = draw_detection(image_path, "id_card_detected.jpg")
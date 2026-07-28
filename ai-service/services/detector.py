from pathlib import Path

from ultralytics import YOLO


class FoodDetector:
    def __init__(self):
        self.model = YOLO("yolo11n.pt")

    def analyse(self, image_path: Path):
        results = self.model(
            image_path,
            device="mps",
        )

        detections = []

        for result in results:
            boxes = result.boxes

            for box in boxes:
                class_id = int(box.cls[0])

                confidence = float(box.conf[0])

                detections.append(
                    {
                        "class_id": class_id,
                        "confidence": confidence,
                    }
                )

        return detections


food_detector = FoodDetector()
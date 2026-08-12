from pathlib import Path

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_analyze_meal(monkeypatch):
    def mock_download_file(s3_key: str):
        return Path("/tmp/fake_image.jpg")

    def mock_analyse(image_path):
        return [
            {
                "class_id": 47,
                "confidence": 0.91,
            }
        ]
    
    def mock_predict(image_path):
        return {
            "calories": 500.0,
            "protein": 30.0,
            "carbs": 50.0,
            "fat": 15.0,
            "confidence": 0.8,
        }

    monkeypatch.setattr(
        "routers.analyze.download_file",
        mock_download_file,
    )

    monkeypatch.setattr(
        "routers.analyze.food_detector.analyse",
        mock_analyse,
    )

    monkeypatch.setattr(
        "routers.analyze.predict",
        mock_predict,
    )

    response = client.post(
        "/analyze/meal",
        json={
            "s3_key": "uploads/test-meal.jpg",
        },
    )

    assert response.status_code == 200

    assert response.json()["nutrition"] == {
        "calories": 500.0,
        "protein": 30.0,
        "carbs": 50.0,
        "fat": 15.0,
        "confidence": 0.8,
    }

    assert response.json()["detections"] == [
        {
            "class_id": 47,
            "confidence": 0.91,
        }
    ]


def test_analyze_meal_missing_s3_key():
    response = client.post(
        "/analyze/meal",
        json={},
    )

    assert response.status_code == 422
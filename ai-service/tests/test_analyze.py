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

    monkeypatch.setattr(
        "routers.analyze.download_file",
        mock_download_file,
    )

    monkeypatch.setattr(
        "routers.analyze.food_detector.analyse",
        mock_analyse,
    )

    response = client.post(
        "/analyze/meal",
        json={
            "s3_key": "uploads/test-meal.jpg",
        },
    )

    assert response.status_code == 200

    assert response.json() == {
        "detections": [
            {
                "class_id": 47,
                "confidence": 0.91,
            }
        ]
    }


def test_analyze_meal_missing_s3_key():
    response = client.post(
        "/analyze/meal",
        json={},
    )

    assert response.status_code == 422
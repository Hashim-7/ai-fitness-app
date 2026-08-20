from pathlib import Path

from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_analyze_meal(monkeypatch):

    def mock_download_file(s3_key: str):
        return Path("/tmp/fake_image.jpg")

    def mock_analyse_meal(image_path):
        return {
            "items": [
                {
                    "name": "cottage cheese",
                    "confidence": 0.91,
                }
            ],
            "calories": 98.0,
            "protein": 11.0,
            "carbs": 3.4,
            "fat": 4.3,
        }

    monkeypatch.setattr(
        "routers.analyze.download_file",
        mock_download_file,
    )

    monkeypatch.setattr(
        "routers.analyze.analyse_meal",
        mock_analyse_meal,
    )

    response = client.post(
        "/analyze/meal",
        json={
            "s3_key": "uploads/test-meal.jpg",
        },
    )

    assert response.status_code == 200

    assert response.json() == {
        "items": [
            {
                "name": "cottage cheese",
                "confidence": 0.91,
            }
        ],
        "calories": 98.0,
        "protein": 11.0,
        "carbs": 3.4,
        "fat": 4.3,
    }


def test_analyze_meal_missing_s3_key():

    response = client.post(
        "/analyze/meal",
        json={},
    )

    assert response.status_code == 422

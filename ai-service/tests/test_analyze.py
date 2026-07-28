from pathlib import Path

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_analyze_meal(monkeypatch):
    def mock_download_file(s3_key: str):
        return Path("/tmp/fake_image.jpg")

    monkeypatch.setattr(
        "routers.analyze.download_file",
        mock_download_file,
    )

    response = client.post(
        "/analyze/meal",
        json={
            "s3_key": "uploads/test-meal.jpg",
        },
    )

    assert response.status_code == 200

    assert response.json() == {
        "foods": [
            {
                "name": "Chicken Breast",
                "estimated_grams": 150,
                "calories": 248,
                "protein": 46,
                "carbs": 0,
                "fat": 5,
                "confidence": 0.95,
            }
        ],
        "calories": 248,
        "macros": {
            "protein": 46,
            "carbs": 0,
            "fat": 5,
        },
        "confidence": 0.95,
    }


def test_analyze_meal_missing_s3_key():
    response = client.post(
        "/analyze/meal",
        json={},
    )

    assert response.status_code == 422
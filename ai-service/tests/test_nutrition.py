from services.food_nutrition import estimate_food_nutrition


def test_food_nutrition():

    result = estimate_food_nutrition(
        "cottage cheese",
        100,
    )

    assert result is not None
    assert result["name"] == "cottage cheese"
    assert result["estimated_grams"] == 100
    assert result["calories"] == 98.0
    assert result["protein"] == 11.0
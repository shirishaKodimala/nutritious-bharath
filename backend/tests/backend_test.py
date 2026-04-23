"""Backend tests for Nutritious India API."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://desi-nutrition-33.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Health ---
def test_root_ok(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"


# --- Profile ---
def test_profile_create_and_get(client):
    payload = {
        "mother_name": "TEST_Priya",
        "child_name": "TEST_Aarav",
        "child_age_months": 30,
        "child_weight_kg": 12.5,
        "child_height_cm": 90.0,
        "allergies": ["peanuts"],
        "region": "south",
        "language": "en",
        "dietary": "vegetarian",
    }
    r = client.post(f"{API}/profile", json=payload)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["mother_name"] == "TEST_Priya"
    assert created["child_age_months"] == 30
    assert "id" in created

    # GET verifies persistence
    r2 = client.get(f"{API}/profile")
    assert r2.status_code == 200
    got = r2.json()
    assert got is not None
    assert got["child_name"] == "TEST_Aarav"
    assert got["region"] == "south"


def test_profile_upsert_singleton(client):
    # Second post should update the same singleton
    payload = {
        "mother_name": "TEST_Priya2",
        "child_name": "TEST_Aarav2",
        "child_age_months": 28,
        "child_weight_kg": 11.0,
        "child_height_cm": 88.0,
        "allergies": [],
        "region": "north",
        "language": "hi",
        "dietary": "vegetarian",
    }
    r = client.post(f"{API}/profile", json=payload)
    assert r.status_code == 200
    r2 = client.get(f"{API}/profile")
    got = r2.json()
    assert got["mother_name"] == "TEST_Priya2"
    assert got["language"] == "hi"


def test_profile_validation(client):
    r = client.post(f"{API}/profile", json={"mother_name": "only"})
    assert r.status_code == 422


# --- Recipes ---
def test_list_recipes_seeded(client):
    r = client.get(f"{API}/recipes")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 50
    sample = data[0]
    assert "id" in sample and "title" in sample and "en" in sample["title"]
    assert "nutrition" in sample


def test_filter_breakfast(client):
    r = client.get(f"{API}/recipes", params={"category": "breakfast"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert all(x["category"] == "breakfast" for x in data)


def test_search_khichdi(client):
    r = client.get(f"{API}/recipes", params={"search": "khichdi"})
    assert r.status_code == 200
    data = r.json()
    assert len(data) > 0
    assert any("khichdi" in x["title"]["en"].lower() for x in data)


def test_recipe_detail(client):
    all_r = client.get(f"{API}/recipes").json()
    rid = all_r[0]["id"]
    r = client.get(f"{API}/recipes/{rid}")
    assert r.status_code == 200
    assert r.json()["id"] == rid


def test_recipe_not_found(client):
    r = client.get(f"{API}/recipes/nonexistent-id")
    assert r.status_code == 404


# --- Growth ---
def test_growth_assessment(client):
    r = client.get(f"{API}/growth/assessment")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    # After profile exists
    assert data["status"] in {"on-track", "below", "above"}
    assert "bmi" in data and data["bmi"] > 0


# --- Meal Plan (Claude) ---
def test_meal_plan_generate(client):
    r = client.post(f"{API}/meal-plan/generate", json={}, timeout=90)
    assert r.status_code == 200, r.text
    plan = r.json()
    assert "days" in plan
    assert len(plan["days"]) == 7
    days_names = [d["day"] for d in plan["days"]]
    assert days_names[0] == "Monday"
    for d in plan["days"]:
        for k in ("breakfast", "lunch", "snack", "dinner", "tip"):
            assert d[k]
    assert isinstance(plan["shopping_list"], list)
    assert len(plan["shopping_list"]) > 0


def test_meal_plan_latest(client):
    r = client.get(f"{API}/meal-plan/latest")
    assert r.status_code == 200
    data = r.json()
    assert data is not None
    assert len(data["days"]) == 7

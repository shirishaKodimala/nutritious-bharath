from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
import httpx
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import uuid
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from recipes_seed import RECIPES
from substitutions import get_substitutions_for_ingredients, SUBSTITUTIONS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Nutritious India API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class Profile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mother_name: str
    child_name: str
    child_age_months: int
    child_weight_kg: float
    child_height_cm: float
    allergies: List[str] = []
    region: str = "pan-india"
    language: str = "en"
    dietary: str = "vegetarian"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProfileCreate(BaseModel):
    mother_name: str
    child_name: str
    child_age_months: int
    child_weight_kg: float
    child_height_cm: float
    allergies: List[str] = []
    region: str = "pan-india"
    language: str = "en"
    dietary: str = "vegetarian"


class Recipe(BaseModel):
    id: str
    title: Dict[str, str]
    category: str
    region: str
    age_min: int
    age_max: int
    prep_time: int
    cook_time: int
    difficulty: str
    description: str
    ingredients: List[str]
    steps: List[str]
    nutrition: Dict[str, Any]
    image: str
    ayurvedic: bool
    scientific: bool
    rating: float


class MealPlanRequest(BaseModel):
    profile_id: Optional[str] = None
    unavailable_ingredients: List[str] = []


class MealPlanDay(BaseModel):
    day: str
    breakfast: str
    lunch: str
    snack: str
    dinner: str
    tip: str


class MealPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    profile_id: Optional[str] = None
    days: List[MealPlanDay]
    shopping_list: List[str]
    unavailable_ingredients: List[str] = []
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


async def seed_recipes():
    existing = await db.recipes.count_documents({})
    if existing >= len(RECIPES):
        logger.info(f"Recipes already seeded: {existing}")
        return
    await db.recipes.delete_many({})
    docs = []
    for r in RECIPES:
        doc = {**r, "id": str(uuid.uuid4())}
        docs.append(doc)
    await db.recipes.insert_many(docs)
    logger.info(f"Seeded {len(docs)} recipes")


@api_router.get("/")
async def root():
    return {"message": "Nutritious India API", "status": "ok"}


@api_router.post("/profile", response_model=Profile)
async def create_or_update_profile(payload: ProfileCreate):
    existing = await db.profiles.find_one({}, {"_id": 0})
    if existing:
        await db.profiles.update_one({"id": existing["id"]}, {"$set": payload.dict()})
        updated = {**existing, **payload.dict()}
        return Profile(**updated)
    profile = Profile(**payload.dict())
    await db.profiles.insert_one(profile.dict().copy())
    return profile


@api_router.get("/profile", response_model=Optional[Profile])
async def get_profile():
    doc = await db.profiles.find_one({}, {"_id": 0})
    if not doc:
        return None
    return Profile(**doc)


@api_router.get("/recipes", response_model=List[Recipe])
async def list_recipes(category: Optional[str] = None, region: Optional[str] = None, search: Optional[str] = None):
    q: Dict[str, Any] = {}
    if category and category != "all":
        q["category"] = category
    if region and region != "all":
        q["$or"] = [{"region": region}, {"region": "pan-india"}]
    cursor = db.recipes.find(q, {"_id": 0})
    recipes = await cursor.to_list(500)
    if search:
        s = search.lower()
        recipes = [r for r in recipes if s in r["title"]["en"].lower() or s in r["description"].lower()]
    return [Recipe(**r) for r in recipes]


@api_router.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    doc = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Recipe not found")
    return Recipe(**doc)


@api_router.get("/recipes/{recipe_id}/substitutions")
async def recipe_substitutions(recipe_id: str):
    doc = await db.recipes.find_one({"id": recipe_id}, {"_id": 0, "ingredients": 1})
    if not doc:
        raise HTTPException(404, "Recipe not found")
    return {"substitutions": get_substitutions_for_ingredients(doc["ingredients"])}


@api_router.post("/meal-plan/generate", response_model=MealPlan)
async def generate_meal_plan(payload: MealPlanRequest):
    profile = await db.profiles.find_one({}, {"_id": 0})
    if not profile:
        raise HTTPException(400, "Please create a profile first")

    all_recipes = await db.recipes.find({}, {"_id": 0}).to_list(500)
    recipe_titles = [r["title"]["en"] for r in all_recipes]

    unavailable = [i.strip().lower() for i in (payload.unavailable_ingredients or []) if i.strip()]

    # Build swap hints for Claude based on unavailable ingredients
    swap_hints = []
    for ing in unavailable:
        subs = SUBSTITUTIONS.get(ing)
        if subs:
            alts = ", ".join([s["swap"] for s in subs])
            swap_hints.append(f"- {ing} → use {alts}")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        system_msg = (
            "You are a pediatric nutritionist specializing in Indian cuisine for toddlers aged 2-3 years. "
            "You blend Ayurvedic wisdom with modern nutrition science. "
            "Always respond in valid JSON only, no markdown, no explanations."
        )

        allergies = ", ".join(profile.get("allergies", [])) or "none"
        region = profile.get("region", "pan-india")

        pantry_block = ""
        if unavailable:
            pantry_block = f"\n\nIMPORTANT — these ingredients are UNAVAILABLE (mother is out of them), do NOT use them: {', '.join(unavailable)}."
            if swap_hints:
                pantry_block += "\nPreferred substitutions to use instead:\n" + "\n".join(swap_hints)

        user_text = f"""Generate a 7-day meal plan for a {profile['child_age_months']}-month-old child named {profile['child_name']}.
Region preference: {region}. Allergies: {allergies}. Dietary: {profile.get('dietary', 'vegetarian')}.{pantry_block}

You MAY use these recipes (pick variety): {', '.join(recipe_titles[:40])}

Return ONLY valid JSON in this exact structure, no extra text:
{{
  "days": [
    {{"day": "Monday", "breakfast": "...", "lunch": "...", "snack": "...", "dinner": "...", "tip": "short ayurvedic or nutrition tip"}}
  ],
  "shopping_list": ["item1", "item2"]
}}
Include all 7 days Monday to Sunday. Make sure the shopping_list does NOT contain the unavailable ingredients listed above."""

        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"meal-plan-{uuid.uuid4()}",
            system_message=system_msg,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        response = await chat.send_message(UserMessage(text=user_text))
        text = response.strip()
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            text = match.group(0)
        data = json.loads(text)

        plan = MealPlan(
            profile_id=profile["id"],
            days=[MealPlanDay(**d) for d in data["days"]],
            shopping_list=data.get("shopping_list", []),
            unavailable_ingredients=unavailable,
        )
    except Exception as e:
        logger.error(f"Claude generation failed: {e}, using fallback plan")
        plan = _fallback_plan(profile, all_recipes, unavailable)

    await db.meal_plans.insert_one(plan.dict().copy())
    return plan


def _fallback_plan(profile: dict, recipes: list, unavailable: list[str] = None) -> MealPlan:
    unavailable = unavailable or []
    # Filter recipes that mention any unavailable ingredient
    def is_ok(r):
        joined = " ".join(r.get("ingredients", [])).lower()
        return not any(u in joined for u in unavailable)

    filtered = [r for r in recipes if is_ok(r)] or recipes

    by_cat = {"breakfast": [], "lunch": [], "snack": [], "dinner": []}
    for r in filtered:
        if r["category"] in by_cat:
            by_cat[r["category"]].append(r["title"]["en"])

    days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    tips = [
        "Warm ghee on grains aids digestion and brain development.",
        "Introduce one new vegetable every week to expand palate.",
        "Serve meals at consistent times to build healthy rhythm.",
        "Seasonal fruits are nature's medicine — eat what grows nearby.",
        "Cumin water after meals supports toddler digestion.",
        "A little turmeric daily boosts immunity naturally.",
        "Sit together during meals — food tastes better with family.",
    ]
    days = []
    for i, day_name in enumerate(days_of_week):
        days.append(MealPlanDay(
            day=day_name,
            breakfast=by_cat["breakfast"][i % max(1, len(by_cat["breakfast"]))] if by_cat["breakfast"] else "Ragi Porridge",
            lunch=by_cat["lunch"][i % max(1, len(by_cat["lunch"]))] if by_cat["lunch"] else "Dal Khichdi",
            snack=by_cat["snack"][i % max(1, len(by_cat["snack"]))] if by_cat["snack"] else "Fruit Chaat",
            dinner=by_cat["dinner"][i % max(1, len(by_cat["dinner"]))] if by_cat["dinner"] else "Soft Chapati with Dal",
            tip=tips[i],
        ))
    shopping = ["Rice", "Wheat flour", "Moong dal", "Toor dal", "Ghee", "Milk", "Yogurt",
                "Seasonal vegetables", "Seasonal fruits", "Turmeric", "Cumin", "Jaggery", "Cardamom"]
    shopping = [s for s in shopping if s.lower() not in unavailable]
    return MealPlan(profile_id=profile.get("id"), days=days, shopping_list=shopping, unavailable_ingredients=unavailable)


@api_router.get("/meal-plan/latest", response_model=Optional[MealPlan])
async def get_latest_plan():
    doc = await db.meal_plans.find_one({}, {"_id": 0}, sort=[("generated_at", -1)])
    if not doc:
        return None
    return MealPlan(**doc)


@api_router.get("/growth/assessment")
async def growth_assessment():
    p = await db.profiles.find_one({}, {"_id": 0})
    if not p:
        return {"status": "no_profile"}
    age_m = p["child_age_months"]
    weight = p["child_weight_kg"]
    height = p["child_height_cm"]
    expected_weight = 10 + (max(age_m, 24) - 24) * 0.2
    expected_height = 86 + (max(age_m, 24) - 24) * 0.8
    status = "on-track"
    if weight < expected_weight - 1.5:
        status = "below"
    elif weight > expected_weight + 2:
        status = "above"
    return {
        "status": status,
        "weight_kg": weight,
        "expected_weight_kg": round(expected_weight, 1),
        "height_cm": height,
        "expected_height_cm": round(expected_height, 1),
        "bmi": round(weight / ((height / 100) ** 2), 1) if height > 0 else 0,
    }


# Voice search — Whisper transcription
@api_router.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = Form("en")):
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        import tempfile

        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(400, "Empty audio file")

        ext = "m4a"
        if file.filename and "." in file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in ("mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"):
            ext = "m4a"

        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        stt = OpenAISpeechToText(api_key=os.environ["EMERGENT_LLM_KEY"])
        with open(tmp_path, "rb") as f:
            response = await stt.transcribe(
                file=f,
                model="whisper-1",
                response_format="json",
                language=language if language in ("en", "hi", "te") else "en",
            )
        os.unlink(tmp_path)
        return {"text": response.text.strip()}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(500, f"Transcription failed: {str(e)}")


# Barcode lookup via Open Food Facts (no API key needed)
@api_router.get("/barcode/{code}")
async def lookup_barcode(code: str):
    try:
        async with httpx.AsyncClient(timeout=10) as cx:
            r = await cx.get(f"https://world.openfoodfacts.org/api/v0/product/{code}.json")
            data = r.json()
        if data.get("status") != 1 or not data.get("product"):
            return {"found": False, "code": code}
        p = data["product"]
        nutr = p.get("nutriments", {})
        return {
            "found": True,
            "code": code,
            "name": p.get("product_name") or p.get("generic_name") or "Unknown",
            "brand": p.get("brands", ""),
            "image": p.get("image_front_url") or p.get("image_url") or "",
            "nutrition_grade": p.get("nutrition_grades", ""),
            "nova_group": p.get("nova_group"),  # 1-4 processing level (1=unprocessed)
            "nutrients_per_100g": {
                "energy_kcal": nutr.get("energy-kcal_100g"),
                "protein_g": nutr.get("proteins_100g"),
                "carbs_g": nutr.get("carbohydrates_100g"),
                "sugars_g": nutr.get("sugars_100g"),
                "fat_g": nutr.get("fat_100g"),
                "saturated_fat_g": nutr.get("saturated-fat_100g"),
                "fiber_g": nutr.get("fiber_100g"),
                "salt_g": nutr.get("salt_100g"),
                "sodium_g": nutr.get("sodium_100g"),
            },
            "ingredients_text": p.get("ingredients_text", ""),
            "allergens": [a.replace("en:", "") for a in p.get("allergens_tags", [])],
        }
    except Exception as e:
        logger.error(f"Barcode lookup failed: {e}")
        raise HTTPException(500, f"Lookup failed: {str(e)}")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await seed_recipes()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

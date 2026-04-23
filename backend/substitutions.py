"""Global ingredient substitutions — fuzzy-matched on recipe ingredient strings."""

# Keyed by lowercase keyword found in ingredients text
SUBSTITUTIONS = {
    "ghee": [
        {"swap": "Coconut oil", "reason": "Dairy-free, tridoshic"},
        {"swap": "Cultured butter", "reason": "Similar richness"},
    ],
    "milk": [
        {"swap": "Almond milk", "reason": "Lactose-free, calcium"},
        {"swap": "Coconut milk", "reason": "Creamy, dairy-free"},
        {"swap": "Oat milk", "reason": "Mild flavor, fiber"},
    ],
    "wheat flour": [
        {"swap": "Ragi flour", "reason": "Gluten-free, calcium-rich"},
        {"swap": "Jowar flour", "reason": "Gluten-free, iron"},
        {"swap": "Oat flour", "reason": "Fiber-rich, gluten-free"},
    ],
    "paneer": [
        {"swap": "Tofu", "reason": "Vegan, lower fat"},
        {"swap": "Crumbled ricotta", "reason": "Similar texture"},
    ],
    "yogurt": [
        {"swap": "Coconut yogurt", "reason": "Dairy-free probiotic"},
        {"swap": "Buttermilk", "reason": "Lighter, cooling"},
    ],
    "curd": [
        {"swap": "Coconut yogurt", "reason": "Dairy-free probiotic"},
        {"swap": "Buttermilk", "reason": "Lighter, cooling"},
    ],
    "jaggery": [
        {"swap": "Date paste", "reason": "Natural, mineral-rich"},
        {"swap": "Honey (above 1yr)", "reason": "Easy to digest"},
        {"swap": "Coconut sugar", "reason": "Low glycemic"},
    ],
    "sugar": [
        {"swap": "Jaggery", "reason": "Iron-rich, traditional"},
        {"swap": "Date paste", "reason": "Whole food sweetener"},
    ],
    "rice": [
        {"swap": "Quinoa", "reason": "Complete protein"},
        {"swap": "Broken wheat (dalia)", "reason": "Fiber, slow-release"},
    ],
    "semolina": [
        {"swap": "Broken wheat (dalia)", "reason": "More fiber"},
        {"swap": "Ragi flour (slurry)", "reason": "Gluten-free option"},
    ],
    "besan": [
        {"swap": "Moong dal flour", "reason": "Lighter, easier to digest"},
    ],
    "moong dal": [
        {"swap": "Masoor dal", "reason": "Faster cooking"},
        {"swap": "Split toor dal", "reason": "Richer protein"},
    ],
    "toor dal": [
        {"swap": "Moong dal", "reason": "Easier to digest"},
        {"swap": "Masoor dal", "reason": "Quick cooking"},
    ],
    "oats": [
        {"swap": "Ragi flakes", "reason": "Calcium-rich, local"},
        {"swap": "Poha (flattened rice)", "reason": "Light, gentle"},
    ],
    "chicken": [
        {"swap": "Paneer cubes", "reason": "Vegetarian protein"},
        {"swap": "Tofu", "reason": "Vegan, iron"},
    ],
    "egg": [
        {"swap": "Mashed banana", "reason": "Binding for baking"},
        {"swap": "Flaxseed gel", "reason": "Vegan, omega-3"},
    ],
    "fish": [
        {"swap": "Paneer", "reason": "Vegetarian swap"},
        {"swap": "Sprouted mung", "reason": "Plant protein"},
    ],
    "almond": [
        {"swap": "Cashew", "reason": "Similar texture"},
        {"swap": "Pumpkin seeds", "reason": "Nut-free, zinc"},
    ],
    "peanut": [
        {"swap": "Sunflower seeds", "reason": "Allergy-friendly"},
        {"swap": "Roasted chana", "reason": "Crunchy, protein"},
    ],
    "coconut": [
        {"swap": "Cashew paste", "reason": "Creamy alternative"},
    ],
    "banana": [
        {"swap": "Mashed apple", "reason": "Lower potassium"},
        {"swap": "Sweet potato", "reason": "Similar sweetness"},
    ],
}


def get_substitutions_for_ingredients(ingredients: list[str]) -> list[dict]:
    """Return list of {ingredient, alternatives} entries for ingredients that have subs."""
    result = []
    seen = set()
    for ing in ingredients:
        low = ing.lower()
        for key, subs in SUBSTITUTIONS.items():
            if key in low and key not in seen:
                seen.add(key)
                result.append({"ingredient": key, "alternatives": subs})
                break
    return result

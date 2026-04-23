"""Ayurvedic content: Dosha quiz, Ritucharya (seasons), Herbs glossary."""
from datetime import datetime

# Six Indian seasons (Ritucharya)
SEASONS = [
    {"key": "shishira", "name": "Shishira (Late Winter)", "months": [1, 2],
     "emoji": "❄️", "colors": ["#A8D0E6", "#F5F5DC"],
     "guidance": "Warming foods, ghee, ginger, garlic. Avoid cold drinks and raw salads.",
     "favor": ["ghee", "ginger", "garlic", "honey", "sesame"],
     "reduce": ["cold drinks", "raw salads", "ice cream"]},
    {"key": "vasanta", "name": "Vasanta (Spring)", "months": [3, 4],
     "emoji": "🌸", "colors": ["#F4E4C1", "#7BA474"],
     "guidance": "Light, bitter, astringent foods. Reduce dairy and sweets that increase Kapha.",
     "favor": ["barley", "honey", "turmeric", "fenugreek greens", "bitter gourd"],
     "reduce": ["heavy sweets", "fried foods", "cold dairy"]},
    {"key": "grishma", "name": "Grishma (Summer)", "months": [5, 6],
     "emoji": "☀️", "colors": ["#FFB84D", "#F4E4C1"],
     "guidance": "Cooling, hydrating foods. Buttermilk, coconut water, seasonal fruits.",
     "favor": ["buttermilk", "coconut water", "mango", "melon", "rice"],
     "reduce": ["spicy food", "sour items", "excess salt"]},
    {"key": "varsha", "name": "Varsha (Monsoon)", "months": [7, 8],
     "emoji": "🌧️", "colors": ["#7BA474", "#4B0082"],
     "guidance": "Light, warm, freshly cooked. Boil water. Careful with raw veggies.",
     "favor": ["warm dal", "rice", "ginger tea", "cooked veggies", "ghee"],
     "reduce": ["street food", "raw salads", "leftovers", "seafood"]},
    {"key": "sharada", "name": "Sharada (Autumn)", "months": [9, 10],
     "emoji": "🍂", "colors": ["#D2691E", "#FFB84D"],
     "guidance": "Sweet, bitter, astringent foods. Cooling herbs to balance Pitta.",
     "favor": ["ghee", "milk", "sweet fruits", "leafy greens", "coriander"],
     "reduce": ["sour", "salty", "spicy foods", "fermented items"]},
    {"key": "hemanta", "name": "Hemanta (Early Winter)", "months": [11, 12],
     "emoji": "🔥", "colors": ["#8B4513", "#D2691E"],
     "guidance": "Warm, nourishing, unctuous foods. Time for ghee, nuts, and stews.",
     "favor": ["ghee", "milk", "jaggery", "nuts", "warm soups"],
     "reduce": ["cold foods", "light meals", "dried snacks"]},
]

def current_season() -> dict:
    m = datetime.now().month
    for s in SEASONS:
        if m in s["months"]:
            return s
    return SEASONS[0]


# Dosha quiz — simple 8-question toddler-focused version
DOSHA_QUIZ = [
    {"q": "How does your child's body frame look?",
     "options": [
         {"label": "Slim, light, small-boned", "dosha": "vata"},
         {"label": "Medium, muscular, well-proportioned", "dosha": "pitta"},
         {"label": "Sturdy, well-built, rounded", "dosha": "kapha"},
     ]},
    {"q": "What is your child's skin like?",
     "options": [
         {"label": "Dry, rough, cool to touch", "dosha": "vata"},
         {"label": "Warm, soft, often flushed", "dosha": "pitta"},
         {"label": "Smooth, oily, cool and thick", "dosha": "kapha"},
     ]},
    {"q": "How does your child sleep?",
     "options": [
         {"label": "Light sleeper, often wakes up", "dosha": "vata"},
         {"label": "Moderate sleep, sweats a little", "dosha": "pitta"},
         {"label": "Deep, long sleeper", "dosha": "kapha"},
     ]},
    {"q": "What is your child's appetite like?",
     "options": [
         {"label": "Irregular, easily distracted", "dosha": "vata"},
         {"label": "Strong, gets hungry on time", "dosha": "pitta"},
         {"label": "Steady, can skip meals easily", "dosha": "kapha"},
     ]},
    {"q": "How active is your child?",
     "options": [
         {"label": "Always on the move, restless", "dosha": "vata"},
         {"label": "Energetic with purpose, competitive", "dosha": "pitta"},
         {"label": "Calm, likes to sit and observe", "dosha": "kapha"},
     ]},
    {"q": "How does your child react when upset?",
     "options": [
         {"label": "Worries, gets anxious quickly", "dosha": "vata"},
         {"label": "Gets angry or frustrated", "dosha": "pitta"},
         {"label": "Becomes quiet, stubborn", "dosha": "kapha"},
     ]},
    {"q": "How does your child speak?",
     "options": [
         {"label": "Fast, lots of words", "dosha": "vata"},
         {"label": "Clear, confident", "dosha": "pitta"},
         {"label": "Slow, thoughtful, melodic", "dosha": "kapha"},
     ]},
    {"q": "What does your child prefer?",
     "options": [
         {"label": "Warm, moist, soft foods", "dosha": "vata"},
         {"label": "Cool, refreshing foods", "dosha": "pitta"},
         {"label": "Light, dry, spicy foods", "dosha": "kapha"},
     ]},
]


def compute_dosha(answers: list[str]) -> dict:
    counts = {"vata": 0, "pitta": 0, "kapha": 0}
    for a in answers:
        if a in counts:
            counts[a] += 1
    dominant = max(counts, key=counts.get)
    return {
        "dominant": dominant,
        "scores": counts,
        "guidance": DOSHA_GUIDANCE[dominant],
    }


DOSHA_GUIDANCE = {
    "vata": {
        "name": "Vata (Air + Space)",
        "nature": "Light, quick, creative, needs warmth and routine.",
        "favor": ["Warm, moist, nourishing foods", "Ghee, sesame oil", "Sweet fruits like banana, mango", "Warm milk with cardamom", "Root vegetables"],
        "reduce": ["Cold, dry, raw foods", "Excess caffeine or stimulation", "Irregular meal times"],
        "color": "#8B5FBF",
    },
    "pitta": {
        "name": "Pitta (Fire + Water)",
        "nature": "Focused, intense, needs cooling and calm.",
        "favor": ["Sweet, cooling, mild foods", "Coconut water, cucumber, mint", "Sweet fruits (avoid sour)", "Ghee and milk", "Leafy greens"],
        "reduce": ["Spicy, salty, sour foods", "Fried foods", "Excess heat or sun"],
        "color": "#D2691E",
    },
    "kapha": {
        "name": "Kapha (Earth + Water)",
        "nature": "Stable, calm, strong immunity; needs warmth and activity.",
        "favor": ["Light, dry, warm, spiced foods", "Honey (above 1yr)", "Ginger, pepper, turmeric", "Bitter greens, legumes", "Millets like ragi"],
        "reduce": ["Heavy, oily, cold foods", "Dairy excess", "Sweet snacks between meals"],
        "color": "#7BA474",
    },
}


HERBS = [
    {"key": "tulsi", "name": "Tulsi (Holy Basil)", "name_hi": "तुलसी", "name_te": "తులసి",
     "benefits": ["Immunity", "Cough relief", "Stress support"],
     "dosage": "1-2 fresh leaves steeped in warm water (2yr+)",
     "caution": "Avoid before surgery",
     "image": "https://images.pexels.com/photos/5946081/pexels-photo-5946081.jpeg"},
    {"key": "ajwain", "name": "Ajwain (Carom seeds)", "name_hi": "अजवाइन", "name_te": "వాము",
     "benefits": ["Aids digestion", "Reduces colic and gas", "Warming"],
     "dosage": "Pinch in dal or water (6mo+)",
     "caution": "Use sparingly — strong flavor",
     "image": "https://images.pexels.com/photos/5945896/pexels-photo-5945896.jpeg"},
    {"key": "saunf", "name": "Saunf (Fennel)", "name_hi": "सौंफ़", "name_te": "సోంపు",
     "benefits": ["Digestive after meals", "Cooling", "Freshens breath"],
     "dosage": "Pinch of seeds after meal (12mo+)",
     "caution": "Avoid large amounts",
     "image": "https://images.pexels.com/photos/4198713/pexels-photo-4198713.jpeg"},
    {"key": "jeera", "name": "Jeera (Cumin)", "name_hi": "जीरा", "name_te": "జీలకర్ర",
     "benefits": ["Boosts Agni (digestion)", "Iron-rich", "Mild"],
     "dosage": "Pinch in tempering daily (6mo+)",
     "caution": "Generally safe",
     "image": "https://images.pexels.com/photos/4198718/pexels-photo-4198718.jpeg"},
    {"key": "haldi", "name": "Haldi (Turmeric)", "name_hi": "हल्दी", "name_te": "పసుపు",
     "benefits": ["Anti-inflammatory", "Immunity", "Wound healing"],
     "dosage": "Pinch daily in cooking (6mo+); 1/4 tsp warm milk (2yr+)",
     "caution": "Excess stains teeth",
     "image": "https://images.pexels.com/photos/4198716/pexels-photo-4198716.jpeg"},
    {"key": "hing", "name": "Hing (Asafoetida)", "name_hi": "हींग", "name_te": "ఇంగువ",
     "benefits": ["Relieves gas", "Anti-bloating", "Boosts digestion"],
     "dosage": "Tiny pinch in dal/sabzi (10mo+)",
     "caution": "Strong — use very little",
     "image": "https://images.pexels.com/photos/4198715/pexels-photo-4198715.jpeg"},
    {"key": "ginger", "name": "Adrak (Ginger)", "name_hi": "अदरक", "name_te": "అల్లం",
     "benefits": ["Warming", "Nausea relief", "Cold & cough"],
     "dosage": "Grated pinch in warm water/honey (2yr+)",
     "caution": "Avoid on empty stomach",
     "image": "https://images.pexels.com/photos/4198717/pexels-photo-4198717.jpeg"},
    {"key": "cardamom", "name": "Elaichi (Cardamom)", "name_hi": "इलायची", "name_te": "ఏలకులు",
     "benefits": ["Sweet digestive", "Freshens breath", "Mild cooling"],
     "dosage": "Crushed pinch in milk/sweets (12mo+)",
     "caution": "Use whole for toddlers",
     "image": "https://images.pexels.com/photos/4198712/pexels-photo-4198712.jpeg"},
    {"key": "amla", "name": "Amla (Indian Gooseberry)", "name_hi": "आंवला", "name_te": "ఉసిరి",
     "benefits": ["Vitamin C powerhouse", "Immunity", "Hair/skin"],
     "dosage": "1 tsp fresh juice or pulp (2yr+)",
     "caution": "Sour — mix with honey",
     "image": "https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg"},
    {"key": "brahmi", "name": "Brahmi", "name_hi": "ब्राह्मी", "name_te": "బ్రాహ్మి",
     "benefits": ["Memory", "Focus", "Calming"],
     "dosage": "Consult Ayurvedic practitioner (3yr+)",
     "caution": "Use only under guidance",
     "image": "https://images.pexels.com/photos/5946970/pexels-photo-5946970.jpeg"},
]


def age_stage(age_months: int) -> dict:
    if age_months < 6:
        return {"key": "0-6mo", "label": "Newborn (0-6mo)", "focus": "Exclusive breastfeeding/formula"}
    if age_months < 12:
        return {"key": "6-12mo", "label": "Weaning (6-12mo)", "focus": "First foods, soft purées, single ingredients"}
    if age_months < 24:
        return {"key": "12-24mo", "label": "Toddler (1-2yr)", "focus": "Mashed foods, finger foods, variety"}
    if age_months < 36:
        return {"key": "24-36mo", "label": "Preschool (2-3yr)", "focus": "Family foods, independence, texture"}
    if age_months < 72:
        return {"key": "36-72mo", "label": "School-ready (3-6yr)", "focus": "Balanced meals, school tiffin, habits"}
    return {"key": "6plus", "label": "6+ years", "focus": "Balanced nutrition, growth years"}

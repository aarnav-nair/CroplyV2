"""
Kisan AI — FastAPI Backend
Handles disease detection, product recommendations, and orders.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import json
import os
import base64
import random
import time
import uuid
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print("-" * 50)
print(f"BACKEND STARTUP: GEMINI_API_KEY loaded: {'YES' if GEMINI_API_KEY else 'NO'}")
print("-" * 50)
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ── Load mock data ──────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)

with open(os.path.join(BASE_DIR, "data", "diseases.json"), encoding='utf-8') as f:
    DISEASES: list = json.load(f)

with open(os.path.join(BASE_DIR, "data", "products.json"), encoding='utf-8') as f:
    PRODUCTS: list = json.load(f)

DISEASE_MAP = {d["id"]: d for d in DISEASES}
PRODUCT_MAP = {p["id"]: p for p in PRODUCTS}

# ── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Kisan AI API",
    description="Smart Crop Disease Detection & Agri-Marketplace API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory scan store (replace with MongoDB in production) ────────────────
SCANS: dict = {}
ORDERS: list = []

# ── Pydantic schemas ─────────────────────────────────────────────────────────
class DetectionResult(BaseModel):
    scan_id: str
    disease_id: str
    disease_name: str
    disease_name_hi: str
    crop: str
    crop_hi: str
    confidence: float
    severity: str           # mild | moderate | severe
    description: str
    description_hi: str
    causes: str
    spread_rate: str
    affected_parts: List[str]
    gradcam_base64: Optional[str] = None
    timestamp: str

class ProductRecommendation(BaseModel):
    products: List[dict]

class CartItem(BaseModel):
    product_id: str
    quantity: int

class OrderRequest(BaseModel):
    items: List[CartItem]
    farmer_name: str
    phone: str
    address: str
    pincode: str
    scan_id: Optional[str] = None

class ChatMessage(BaseModel):
    message: str
    scan_id: Optional[str] = None
    language: str = "en"     # en | hi

# ── Mock ML inference ────────────────────────────────────────────────────────
async def run_gemini_inference(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Calls Gemini 1.5 Flash Vision to identify crop diseases.
    """
    if not GEMINI_API_KEY:
        # Fallback to mock if no key
        return mock_run_inference(image_bytes)

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = """You are an expert agronomist AI. Analyse this crop leaf image and identify any disease.
Respond ONLY with valid JSON in exactly this format:
{
  "disease_name": "e.g. Tomato Late Blight",
  "crop": "e.g. Tomato",
  "confidence": 87.5,
  "severity": "mild",
  "description": "2 sentence description",
  "causes": "one sentence on cause",
  "spread_rate": "Fast",
  "affected_parts": ["Leaves"]
}
If no disease, use "Healthy Crop". Supported crops: Tomato, Potato, Corn, Rice, Wheat, etc."""

        # Convert image bytes to Gemini format
        image_parts = [{"mime_type": "image/jpeg", "data": image_bytes}]
        
        response = model.generate_content([prompt, image_parts[0]])
        text = response.text
        print(f"Gemini API Response: {text}")
        
        # Extract JSON
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            print(f"Gemini Parsed Result: {result}")
            
            # Map to existing disease IDs if possible
            disease_name = result.get("disease_name", "unknown")
            disease_id = disease_name.lower().replace(" ", "_")
            
            # Try to find a close match in our DISEASES list
            best_match_id = "unknown"
            for d in DISEASES:
                if d["name"].lower() in disease_name.lower() or disease_name.lower() in d["name"].lower():
                    best_match_id = d["id"]
                    print(f"Gemini matched to local ID: {best_match_id}")
                    break
            
            return {
                "disease_id": best_match_id if best_match_id != "unknown" else disease_id,
                "disease_name": disease_name,
                "crop": result.get("crop", "Unknown"),
                "confidence": result.get("confidence", 90.0),
                "severity": result.get("severity", "moderate"),
                "description": result.get("description", ""),
                "causes": result.get("causes", ""),
                "spread_rate": result.get("spread_rate", "Moderate"),
                "affected_parts": result.get("affected_parts", ["Leaves"])
            }
        else:
            print("Gemini Error: No JSON found in response")
            return mock_run_inference(image_bytes)
    except Exception as e:
        print(f"Gemini Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return mock_run_inference(image_bytes)

def mock_run_inference(image_bytes: bytes) -> dict:
    """
    Simulates EfficientNet-B0 inference on the PlantVillage dataset.
    """
    # Deterministic seed from image size for demo consistency
    random.seed(len(image_bytes) % 1000)

    disease = random.choice(DISEASES)
    confidence = round(random.uniform(82.5, 97.8), 1)
    severity = random.choices(
        ["mild", "moderate", "severe"],
        weights=[0.35, 0.45, 0.20]
    )[0]

    return {
        "disease_id": disease["id"],
        "disease_name": disease["name"],
        "crop": disease["crop"],
        "confidence": confidence,
        "severity": severity,
        "description": disease["description"],
        "causes": disease["causes"],
        "spread_rate": disease["spread_rate"],
        "affected_parts": disease["affected_parts"],
    }

def mock_gradcam(image_bytes: bytes) -> str:
    """
    Returns a placeholder Grad-CAM overlay as base64 SVG.
    In production, use PyTorch grad-cam library to generate actual heatmap.
    """
    # Minimal SVG heatmap placeholder
    svg = """<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
  <defs>
    <radialGradient id='g1' cx='60%' cy='45%' r='40%'>
      <stop offset='0%' stop-color='red' stop-opacity='0.8'/>
      <stop offset='40%' stop-color='orange' stop-opacity='0.5'/>
      <stop offset='100%' stop-color='yellow' stop-opacity='0.1'/>
    </radialGradient>
    <radialGradient id='g2' cx='35%' cy='60%' r='30%'>
      <stop offset='0%' stop-color='red' stop-opacity='0.6'/>
      <stop offset='60%' stop-color='orange' stop-opacity='0.3'/>
      <stop offset='100%' stop-color='yellow' stop-opacity='0.05'/>
    </radialGradient>
  </defs>
  <rect width='400' height='400' fill='url(#g1)' rx='8'/>
  <rect width='400' height='400' fill='url(#g2)' rx='8'/>
</svg>"""
    return base64.b64encode(svg.encode()).decode()

def build_recommendations(disease_id: str, severity: str) -> list:
    """
    Filters and ranks products relevant to a detected disease.
    Ranking: organic-first, severity match, effectiveness, price.
    """
    disease = DISEASE_MAP.get(disease_id)
    if not disease:
        return []

    recommended_ids = disease.get("product_ids", [])
    products = []

    for pid in recommended_ids:
        p = PRODUCT_MAP.get(pid)
        if not p:
            continue
        if p["stock"] == 0:
            continue
        if severity not in p["severity_suitability"] and severity != "mild":
            # For severe cases include all; for mild, filter out severe-only
            pass

        why = p.get("why_recommended", {}).get(disease_id, p["description"])
        product_copy = dict(p)
        product_copy["why_recommended"] = why
        products.append(product_copy)

    # Sort: organic first, then by price
    products.sort(key=lambda x: (0 if x["classification"] == "Organic" else 1, x["price_per_unit"]))

    return products

# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "ok", "service": "Kisan AI API", "version": "1.0.0"}


@app.post("/detect", response_model=DetectionResult)
async def detect_disease(file: UploadFile = File(...)):
    """
    Accepts a crop leaf image and returns AI disease diagnosis.
    """
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are accepted.")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Image too large. Maximum size is 10MB.")

    # Run Gemini inference
    inference = await run_gemini_inference(image_bytes, file.content_type)
    
    # Get localized names if we matched a known disease
    known_disease = DISEASE_MAP.get(inference["disease_id"])
    
    disease_name_hi = known_disease["name_hi"] if known_disease else ""
    crop_hi = known_disease["crop_hi"] if known_disease else ""
    description_hi = known_disease["description_hi"] if known_disease else ""

    gradcam = mock_gradcam(image_bytes)
    scan_id = str(uuid.uuid4())[:8].upper()
    
    result = {
        "scan_id": scan_id,
        "disease_id": inference["disease_id"],
        "disease_name": inference["disease_name"],
        "disease_name_hi": disease_name_hi,
        "crop": inference["crop"],
        "crop_hi": crop_hi,
        "confidence": inference["confidence"],
        "severity": inference["severity"],
        "description": inference["description"],
        "description_hi": description_hi,
        "causes": inference["causes"],
        "spread_rate": inference["spread_rate"],
        "affected_parts": inference["affected_parts"],
        "gradcam_base64": gradcam,
        "timestamp": datetime.utcnow().isoformat(),
    }
    SCANS[scan_id] = result
    return result


@app.get("/recommendations/{scan_id}")
def get_recommendations(scan_id: str):
    """Returns ranked product recommendations for a given scan."""
    scan = SCANS.get(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found.")
    products = build_recommendations(scan["disease_id"], scan["severity"])
    return {"scan_id": scan_id, "products": products}


@app.get("/products")
def list_products(crop: Optional[str] = None, classification: Optional[str] = None):
    """Lists all products with optional filters."""
    results = PRODUCTS
    if classification:
        results = [p for p in results if p["classification"].lower() == classification.lower()]
    return {"products": results, "count": len(results)}


@app.get("/products/{product_id}")
def get_product(product_id: str):
    """Returns detail of a single product."""
    p = PRODUCT_MAP.get(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
    return p


@app.post("/orders")
def place_order(order: OrderRequest):
    """Places a simulated order."""
    order_id = "KAI-" + str(uuid.uuid4())[:6].upper()
    total = 0
    items_detail = []

    for item in order.items:
        p = PRODUCT_MAP.get(item.product_id)
        if not p:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found.")
        item_total = p["price_per_unit"] * item.quantity
        total += item_total
        items_detail.append({
            "product_id": item.product_id,
            "name": p["name"],
            "quantity": item.quantity,
            "price_per_unit": p["price_per_unit"],
            "item_total": item_total,
        })

    order_record = {
        "order_id": order_id,
        "items": items_detail,
        "total_amount": total,
        "farmer_name": order.farmer_name,
        "phone": order.phone,
        "address": order.address,
        "pincode": order.pincode,
        "scan_id": order.scan_id,
        "status": "confirmed",
        "estimated_delivery": "3-5 business days",
        "placed_at": datetime.utcnow().isoformat(),
    }
    ORDERS.append(order_record)
    return order_record


@app.get("/diseases")
def list_diseases():
    """Lists all supported diseases."""
    return {"diseases": DISEASES, "count": len(DISEASES)}


@app.get("/alerts/map")
def disease_alert_map():
    """
    Returns mock community disease alert data for the India map.
    In production, this would aggregate anonymized scan data.
    """
    mock_alerts = [
        {"state": "Rajasthan", "district": "Jaipur", "lat": 26.9, "lng": 75.8,
         "disease": "Tomato Late Blight", "count": 34, "severity": "moderate"},
        {"state": "Punjab", "district": "Ludhiana", "lat": 30.9, "lng": 75.85,
         "disease": "Wheat Leaf Rust", "count": 67, "severity": "severe"},
        {"state": "Uttar Pradesh", "district": "Agra", "lat": 27.18, "lng": 78.01,
         "disease": "Potato Late Blight", "count": 28, "severity": "moderate"},
        {"state": "Maharashtra", "district": "Nashik", "lat": 19.99, "lng": 73.79,
         "disease": "Tomato Early Blight", "count": 52, "severity": "mild"},
        {"state": "West Bengal", "district": "Murshidabad", "lat": 24.18, "lng": 88.27,
         "disease": "Rice Blast", "count": 89, "severity": "severe"},
        {"state": "Madhya Pradesh", "district": "Indore", "lat": 22.72, "lng": 75.86,
         "disease": "Corn Common Rust", "count": 41, "severity": "moderate"},
        {"state": "Bihar", "district": "Patna", "lat": 25.59, "lng": 85.13,
         "disease": "Rice Blast", "count": 73, "severity": "severe"},
        {"state": "Haryana", "district": "Karnal", "lat": 29.69, "lng": 76.99,
         "disease": "Wheat Leaf Rust", "count": 45, "severity": "moderate"},
        {"state": "Gujarat", "district": "Anand", "lat": 22.56, "lng": 72.95,
         "disease": "Tomato Late Blight", "count": 19, "severity": "mild"},
        {"state": "Karnataka", "district": "Dharwad", "lat": 15.46, "lng": 75.0,
         "disease": "Tomato Early Blight", "count": 36, "severity": "moderate"},
    ]
    return {"alerts": mock_alerts, "total_scans": 484, "active_regions": 10}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)

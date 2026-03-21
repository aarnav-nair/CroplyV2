"""
Croply — FastAPI Backend
Disease detection, product recommendations, orders, auth, chat logging.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import json, os, base64, random, uuid, hashlib, hmac
import base64 as _b64, json as _json, time as _time

from database import init_db, get_db, User, ChatMessage

# ── Auth config ───────────────────────────────────────────────────────────────
SECRET_KEY       = os.environ.get("JWT_SECRET", "croply-dev-secret-change-in-production")
JWT_EXPIRE_HOURS = 72
bearer_scheme    = HTTPBearer(auto_error=False)

# ── JWT (stdlib only) ─────────────────────────────────────────────────────────
def _b64url_encode(data: bytes) -> str:
    return _b64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return _b64.urlsafe_b64decode(s + "=" * (pad % 4))

def create_token(payload: dict) -> str:
    header = _b64url_encode(_json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    body   = _b64url_encode(_json.dumps({**payload, "exp": int(_time.time()) + JWT_EXPIRE_HOURS * 3600}).encode())
    sig    = _b64url_encode(hmac.new(SECRET_KEY.encode(), f"{header}.{body}".encode(), hashlib.sha256).digest())
    return f"{header}.{body}.{sig}"

def verify_token(token: str) -> dict:
    try:
        h, b, s = token.split(".")
        exp_sig = _b64url_encode(hmac.new(SECRET_KEY.encode(), f"{h}.{b}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(s, exp_sig): raise ValueError("bad sig")
        payload = _json.loads(_b64url_decode(b))
        if payload.get("exp", 0) < int(_time.time()): raise ValueError("expired")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

def hash_password(pw: str) -> str:
    return hashlib.sha256((pw + SECRET_KEY).encode()).hexdigest()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not creds: raise HTTPException(status_code=401, detail="Not authenticated")
    return verify_token(creds.credentials)

def get_optional_user(creds: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not creds: return None
    try:    return verify_token(creds.credentials)
    except: return None

# ── Static data ───────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
with open(os.path.join(BASE_DIR, "data", "diseases.json"), encoding="utf-8") as f: DISEASES = json.load(f)
with open(os.path.join(BASE_DIR, "data", "products.json"),  encoding="utf-8") as f: PRODUCTS = json.load(f)
DISEASE_MAP = {d["id"]: d for d in DISEASES}
PRODUCT_MAP = {p["id"]: p for p in PRODUCTS}

# ── In-memory scan/order store (not worth persisting for prototype) ────────────
SCANS:  dict = {}
ORDERS: list = []

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Croply API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = ""
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class ChatLogRequest(BaseModel):
    session_id: str
    bot_type:   str = "navbot"          # "navbot" | "kisanbot"
    role:       str                     # "user" | "bot"
    message:    str
    language:   str = "en"
    disease:    Optional[str] = None
    crop:       Optional[str] = None
    severity:   Optional[str] = None

class DetectionResult(BaseModel):
    scan_id: str; disease_id: str; disease_name: str; disease_name_hi: str
    crop: str; crop_hi: str; confidence: float; severity: str
    description: str; description_hi: str; causes: str; spread_rate: str
    affected_parts: List[str]; gradcam_base64: Optional[str] = None; timestamp: str

class CartItem(BaseModel):
    product_id: str; quantity: int

class OrderRequest(BaseModel):
    items: List[CartItem]; farmer_name: str; phone: str
    address: str; pincode: str; scan_id: Optional[str] = None

# ── Helpers ───────────────────────────────────────────────────────────────────
def user_to_public(u: User) -> dict:
    return {
        "id": u.id, "name": u.name, "email": u.email or "",
        "phone": u.phone or "", "is_guest": u.is_guest,
        "created_at": u.created_at.isoformat() if u.created_at else "",
    }

def mock_run_inference(image_bytes: bytes) -> dict:
    random.seed(len(image_bytes) % 1000)
    disease    = random.choice(DISEASES)
    confidence = round(random.uniform(82.5, 97.8), 1)
    severity   = random.choices(["mild","moderate","severe"], weights=[0.35,0.45,0.20])[0]
    return {"disease_id": disease["id"], "confidence": confidence, "severity": severity}

def mock_gradcam(image_bytes: bytes) -> str:
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
    disease = DISEASE_MAP.get(disease_id)
    if not disease: return []
    products = []
    for pid in disease.get("product_ids", []):
        p = PRODUCT_MAP.get(pid)
        if not p or p["stock"] == 0: continue
        pc = dict(p)
        pc["why_recommended"] = p.get("why_recommended", {}).get(disease_id, p.get("description",""))
        products.append(pc)
    products.sort(key=lambda x: (0 if x["classification"] == "Organic" else 1, x["price_per_unit"]))
    return products

# ═══════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════

@app.get("/")
def health():
    return {"status": "ok", "service": "Croply API", "version": "1.1.0"}

# ── Auth ──────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if "@" not in email:
        raise HTTPException(400, "Valid email required.")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "An account with this email already exists.")

    user = User(
        id=f"u_{uuid.uuid4().hex[:8]}",
        name=req.name.strip(),
        email=email,
        phone=req.phone or "",
        password_hash=hash_password(req.password),
        is_guest=False,
    )
    db.add(user); db.commit(); db.refresh(user)

    token = create_token({"sub": user.id, "email": email, "name": user.name, "is_guest": False})
    return {"token": token, "user": user_to_public(user)}


@app.post("/auth/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user  = db.query(User).filter(User.email == email).first()
    if not user or user.password_hash != hash_password(req.password):
        raise HTTPException(401, "Incorrect email or password.")

    user.last_seen_at = datetime.utcnow()
    db.commit()

    token = create_token({"sub": user.id, "email": email, "name": user.name, "is_guest": False})
    return {"token": token, "user": user_to_public(user)}


@app.post("/auth/guest")
def guest_login(db: Session = Depends(get_db)):
    guest = User(
        id=f"guest_{uuid.uuid4().hex[:6]}",
        name="Guest",
        is_guest=True,
    )
    db.add(guest); db.commit(); db.refresh(guest)

    token = create_token({"sub": guest.id, "name": "Guest", "is_guest": True})
    return {"token": token, "user": user_to_public(guest)}


@app.get("/auth/me")
def me(current=Depends(get_current_user)):
    return current

# ── Chat logging ──────────────────────────────────────────────────

@app.post("/chat/log", status_code=201)
def log_chat(req: ChatLogRequest, db: Session = Depends(get_db),
             current=Depends(get_optional_user)):
    """
    Stores a single chat turn (user prompt OR bot reply) in the database.
    Called silently by the frontend after every message exchange.
    Works for both authenticated and guest users (user_id from token if present).
    """
    user_id = current.get("sub", "anonymous") if current else "anonymous"

    msg = ChatMessage(
        user_id=user_id,
        session_id=req.session_id,
        bot_type=req.bot_type,
        role=req.role,
        message=req.message,
        language=req.language,
        disease=req.disease,
        crop=req.crop,
        severity=req.severity,
    )
    db.add(msg); db.commit()
    return {"ok": True, "id": msg.id}


@app.get("/chat/history")
def chat_history(
    bot_type: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current=Depends(get_current_user),
):
    """Returns this user's chat history (newest first)."""
    user_id = current["sub"]
    q = db.query(ChatMessage).filter(ChatMessage.user_id == user_id)
    if bot_type: q = q.filter(ChatMessage.bot_type == bot_type)
    msgs = q.order_by(ChatMessage.created_at.desc()).limit(limit).all()
    return [
        {
            "id": m.id, "session_id": m.session_id, "bot_type": m.bot_type,
            "role": m.role, "message": m.message, "language": m.language,
            "disease": m.disease, "crop": m.crop, "severity": m.severity,
            "created_at": m.created_at.isoformat(),
        }
        for m in reversed(msgs)
    ]

# ── Disease Detection ─────────────────────────────────────────────

@app.post("/detect", response_model=DetectionResult)
async def detect_disease(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Only JPEG, PNG, or WebP images are accepted.")
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image too large. Max 10MB.")

    inf     = mock_run_inference(image_bytes)
    disease = DISEASE_MAP[inf["disease_id"]]
    scan_id = uuid.uuid4().hex[:8].upper()
    result  = {
        "scan_id": scan_id, "disease_id": disease["id"],
        "disease_name": disease["name"], "disease_name_hi": disease["name_hi"],
        "crop": disease["crop"], "crop_hi": disease["crop_hi"],
        "confidence": inf["confidence"], "severity": inf["severity"],
        "description": disease["description"], "description_hi": disease["description_hi"],
        "causes": disease["causes"], "spread_rate": disease["spread_rate"],
        "affected_parts": disease["affected_parts"],
        "gradcam_base64": mock_gradcam(image_bytes),
        "timestamp": datetime.utcnow().isoformat(),
    }
    SCANS[scan_id] = result
    return result


@app.get("/recommendations/{scan_id}")
def get_recommendations(scan_id: str):
    scan = SCANS.get(scan_id)
    if not scan: raise HTTPException(404, "Scan not found.")
    return {"scan_id": scan_id, "products": build_recommendations(scan["disease_id"], scan["severity"])}


@app.get("/products")
def list_products(classification: Optional[str] = None):
    results = PRODUCTS
    if classification:
        results = [p for p in results if p["classification"].lower() == classification.lower()]
    return {"products": results, "count": len(results)}


@app.get("/products/{product_id}")
def get_product(product_id: str):
    p = PRODUCT_MAP.get(product_id)
    if not p: raise HTTPException(404, "Product not found.")
    return p


@app.post("/orders")
def place_order(order: OrderRequest):
    order_id = "CRP-" + uuid.uuid4().hex[:6].upper()
    total, items_detail = 0, []
    for item in order.items:
        p = PRODUCT_MAP.get(item.product_id)
        if not p: raise HTTPException(400, f"Product {item.product_id} not found.")
        item_total = p["price_per_unit"] * item.quantity
        total += item_total
        items_detail.append({
            "product_id": item.product_id, "name": p["name"],
            "quantity": item.quantity, "price_per_unit": p["price_per_unit"],
            "item_total": item_total,
        })
    record = {
        "order_id": order_id, "items": items_detail, "total_amount": total,
        "farmer_name": order.farmer_name, "phone": order.phone,
        "address": order.address, "pincode": order.pincode,
        "scan_id": order.scan_id, "status": "confirmed",
        "estimated_delivery": "3-5 business days",
        "placed_at": datetime.utcnow().isoformat(),
    }
    ORDERS.append(record)
    return record


@app.get("/diseases")
def list_diseases():
    return {"diseases": DISEASES, "count": len(DISEASES)}


@app.get("/alerts/map")
def disease_alert_map():
    mock_alerts = [
        {"state":"Rajasthan","district":"Jaipur","lat":26.9,"lng":75.8,"disease":"Tomato Late Blight","count":34,"severity":"moderate"},
        {"state":"Punjab","district":"Ludhiana","lat":30.9,"lng":75.85,"disease":"Wheat Leaf Rust","count":67,"severity":"severe"},
        {"state":"Uttar Pradesh","district":"Agra","lat":27.18,"lng":78.01,"disease":"Potato Late Blight","count":28,"severity":"moderate"},
        {"state":"Maharashtra","district":"Nashik","lat":19.99,"lng":73.79,"disease":"Tomato Early Blight","count":52,"severity":"mild"},
        {"state":"West Bengal","district":"Murshidabad","lat":24.18,"lng":88.27,"disease":"Rice Blast","count":89,"severity":"severe"},
        {"state":"Madhya Pradesh","district":"Indore","lat":22.72,"lng":75.86,"disease":"Corn Common Rust","count":41,"severity":"moderate"},
        {"state":"Bihar","district":"Patna","lat":25.59,"lng":85.13,"disease":"Rice Blast","count":73,"severity":"severe"},
        {"state":"Haryana","district":"Karnal","lat":29.69,"lng":76.99,"disease":"Wheat Leaf Rust","count":45,"severity":"moderate"},
        {"state":"Gujarat","district":"Anand","lat":22.56,"lng":72.95,"disease":"Tomato Late Blight","count":19,"severity":"mild"},
        {"state":"Karnataka","district":"Dharwad","lat":15.46,"lng":75.0,"disease":"Tomato Early Blight","count":36,"severity":"moderate"},
    ]
    return {"alerts": mock_alerts, "total_scans": 484, "active_regions": 10}
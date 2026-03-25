# 🌿 Croply — Smart Crop Disease Detection & Agri-Marketplace
https://croply-kohl.vercel.app/

> **Hackerz Street 4.0 | Manipal University Jaipur | Agriculture Track — Problem #2**

---

## ✨ What it does

1. **Farmer uploads a leaf photo** → AI detects disease in ~2 seconds
2. **Results screen** → Disease name, severity, Grad-CAM heatmap, plain-language description
3. **Recommendations** → Only disease-specific, verified treatments (organic first)
4. **Kisan Bot** → Follow-up questions answered in Hindi or English by Claude AI
5. **Community Alert Map** → Active disease outbreaks across India, crowd-sourced from scans
6. **E-commerce checkout** → Add to cart → order confirmation in under 45 seconds total

---

## 🏗 Architecture

```
kisan-ai/
├── frontend/          React + Tailwind + Vite SPA
│   └── src/
│       ├── components/   All page components
│       ├── services/     API client (with mock fallback)
│       └── data/         Mock data for offline demo
│
└── backend/           FastAPI (Python)
    ├── main.py           All routes: /detect, /recommendations, /orders, /alerts/map
    └── data/
        ├── diseases.json  38-class disease definitions
        └── products.json  8 verified treatment products
```

---

## 🚀 Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The frontend works **standalone without the backend** — it uses realistic mock data automatically.

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs  (Swagger UI)
```

Then set the frontend to use the real API:
```bash
# In frontend/.env.local:
VITE_API_URL=http://localhost:8000
```

---

## 🧠 AI / ML Details

| Component | Details |
|---|---|
| **Model** | EfficientNet-B0 (prototype uses mock inference) |
| **Dataset** | PlantVillage — 38 disease classes, 14 crops |
| **Accuracy** | 87-93% validation accuracy (published benchmark) |
| **Heatmap** | Grad-CAM overlay (SVG placeholder in prototype) |
| **Kisan Bot** | Claude claude-sonnet-4-20250514 via Anthropic API |

To plug in the real PyTorch model, replace `mock_run_inference()` in `backend/main.py` with:
```python
import torch
from torchvision import transforms
from PIL import Image
import io

model = torch.load('efficientnet_plantvillage.pth')
model.eval()

def run_inference(image_bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
    ])
    tensor = transform(img).unsqueeze(0)
    with torch.no_grad():
        output = model(tensor)
        probs = torch.softmax(output, dim=1)
        confidence, class_idx = probs.max(1)
    return CLASS_NAMES[class_idx], float(confidence) * 100
```

---

## 🌐 Deployment

| Service | Platform | Free? |
|---|---|---|
| Frontend | Vercel (`vercel deploy`) | ✅ |
| Backend | Render or Railway | ✅ |
| Database | MongoDB Atlas M0 | ✅ |

---

## 💡 Demo Script (45 seconds)

1. Open on phone → show mobile layout
2. Upload `tomato_late_blight_sample.jpg`
3. Watch 2-second scan animation → Results screen
4. Point to Grad-CAM: *"AI shows exactly where it saw the disease"*
5. Hit **हिंदी** toggle → all text switches
6. Scroll to products: *"Only Late Blight treatments, organic first"*
7. Open Kisan Bot → type *"is this safe near harvest?"*
8. Go to Alert Map → *"34 farmers in Jaipur district affected right now"*
9. Add to cart → checkout → Order confirmed

---

## 📊 Impact

- 58% of India's 1.4B population depends on farming
- Crop diseases cause 20–40% annual yield loss
- Kisan AI gives every farmer agronomist-quality diagnosis in under a minute
- Multi-language (Hindi/English) ensures rural accessibility

---

## ⚠️ Known Limitations (for Q&A)

- Prototype uses mock ML inference — real EfficientNet model weights not included
- Marketplace uses seeded supplier data
- Alert map uses scan data as outbreak proxy (production: + ICAR data)
- Kisan Bot requires Anthropic API key for live responses

---

*Built for Hackerz Street 4.0 — Kisan AI Team*

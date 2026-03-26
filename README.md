# 🌿 CroplyV2 — AI-Powered Crop Intelligence & Agri-Marketplace
https://croply-kohl.vercel.app/

> **Empowering farmers with instant AI disease diagnosis, multi-lingual support, and direct access to targeted agricultural remedies.**

---

## ✨ Features

- **📸 Instant AI Disease Detection:** Upload a leaf photo and get a diagnosis in seconds, complete with severity levels and confidence scores. Powered by Gemini Vision API (with a seamless offline fallback mode).
- **🌍 13 Indian Languages Supported:** Full UI and AI translation supporting Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Odia, Malayalam, Punjabi, Assamese, and English.
- **🤖 KisanBot (Agri AI Assistant):** A context-aware chatbot that knows your crop's exact diagnosis and answers follow-up questions regarding treatment, safety, and prevention.
- **🛒 Smart Agri-Marketplace:** Automatically recommends targeted (organic-first) treatments based on the specific disease detected. 
- **🗺️ Community Alert Map:** Live visualization of disease outbreaks across surrounding districts, providing an early warning system for nearby farms.
- **🌓 Adaptive UI:** A premium, modern interface featuring a fluid "Liquid Gradient" intro animation, dynamic light/dark modes, and fully responsive mobile layouts.

---

## 🏗️ Architecture

```text
CroplyV2/
├── frontend/           # React + TailwindCSS + Vite SPA + Framer Motion
│   ├── src/
│   │   ├── components/ # Modular UI components (Pages, Navbar, Chatbots)
│   │   ├── services/   # Axios API client & Gemini API integrations
│   │   └── data/       # Fallback mock data for offline demos
│
└── backend/            # FastAPI (Python 3.11)
    ├── main.py         # REST Endpoints: /detect, /recommendations, /orders, /auth
    ├── database.py     # SQLite/SQLAlchemy User & Chat logging
    └── data/           # 38-class disease definitions & product catalogs
```

---

## 🚀 Quick Start (Local Development)

### 1. Start the Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API Docs available at http://localhost:8000/docs
```

### 2. Start the Frontend (React / Vite)
```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5174
```

*(Note: The frontend is configured to run flawlessly in "Demo Mode" using mock data if the backend is offline!)*

---

## 🔑 Environment Variables
To enable live AI features and custom backends, create a `.env.local` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🌐 Live Deployment
CroplyV2 is fully configured for automated cloud deployments:
- **Frontend (Vercel):** Connected via `vercel.json` and auto-deploys upon pushes to the `main` branch.
- **Backend (Render):** Uses `render.yaml` Infrastructure-as-Code for zero-config deployments.

---

## 🤝 Contributing
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

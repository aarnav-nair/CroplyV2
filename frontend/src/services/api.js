import axios from "axios";
import {
  MOCK_DETECTION,
  MOCK_PRODUCTS,
  MOCK_ALERTS,
} from "../data/mockData.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

// ── Disease Detection ─────────────────────────────────────────────────────────
export async function detectDisease(imageFile) {
  // Try real backend first
  try {
    const formData = new FormData();
    formData.append("file", imageFile);
    const { data } = await api.post("/detect", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 8000,
    });
    return data;
  } catch {}

  // Use Gemini Vision for real image analysis
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (GEMINI_KEY) {
    try {
      return await detectWithGeminiVision(imageFile, GEMINI_KEY);
    } catch (e) {
      console.warn("Gemini vision failed:", e);
    }
  }

  // Last resort: mock
  await delay(2200);
  return { ...MOCK_DETECTION, scan_id: randomScanId() };
}

// ── Gemini Vision: Crop Disease Detection ─────────────────────────────────────
async function detectWithGeminiVision(imageFile, apiKey) {
  const base64 = await fileToBase64(imageFile);
  const mimeType = imageFile.type || "image/jpeg";

  const prompt = `You are an expert agronomist AI. Analyse this crop leaf image and identify any disease.

Respond ONLY with valid JSON in exactly this format (no markdown, no extra text):
{
  "disease_name": "e.g. Tomato Late Blight",
  "disease_name_hi": "Hindi name",
  "crop": "e.g. Tomato",
  "crop_hi": "Hindi crop name",
  "confidence": 87.5,
  "severity": "mild",
  "pathogen": "scientific name",
  "description": "2 sentence plain description of what you see",
  "description_hi": "same in Hindi",
  "causes": "one sentence on cause",
  "spread_rate": "Fast",
  "affected_parts": ["Leaves"]
}

severity must be one of: mild, moderate, severe
If no disease visible, use disease_name "Healthy Crop" with confidence below 60.
Supported crops: Tomato, Potato, Corn, Rice, Wheat, Apple, Grape, Pepper, Peach, Strawberry.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 512,
        },
      }),
    },
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Gemini response: " + text);

  const result = JSON.parse(jsonMatch[0]);
  return {
    scan_id: randomScanId(),
    disease_id: (result.disease_name || "unknown")
      .toLowerCase()
      .replace(/\s+/g, "_"),
    disease_name: result.disease_name || "Unknown Disease",
    disease_name_hi: result.disease_name_hi || result.disease_name || "",
    crop: result.crop || "Unknown",
    crop_hi: result.crop_hi || result.crop || "",
    confidence: Math.min(99, Math.max(50, Number(result.confidence) || 82)),
    severity: ["mild", "moderate", "severe"].includes(result.severity)
      ? result.severity
      : "moderate",
    pathogen: result.pathogen || "",
    description: result.description || "",
    description_hi: result.description_hi || result.description || "",
    causes: result.causes || "",
    spread_rate: result.spread_rate || "Moderate",
    affected_parts: result.affected_parts || ["Leaves"],
    timestamp: new Date().toISOString(),
  };
}

// ── Product Recommendations ───────────────────────────────────────────────────
export async function getRecommendations(scanId) {
  try {
    const { data } = await api.get("/recommendations/" + scanId);
    return data.products;
  } catch {
    await delay(300);
    return MOCK_PRODUCTS;
  }
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function listProducts() {
  try {
    const { data } = await api.get("/products");
    return data.products;
  } catch {
    return MOCK_PRODUCTS;
  }
}

// ── Place Order ───────────────────────────────────────────────────────────────
export async function placeOrder(orderPayload) {
  try {
    const { data } = await api.post("/orders", orderPayload);
    return data;
  } catch {
    await delay(800);
    return {
      order_id: "CRP-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      total_amount: orderPayload.total_amount || 0,
      status: "confirmed",
      estimated_delivery: "3-5 business days",
      ...orderPayload,
    };
  }
}

// ── Alert Map ─────────────────────────────────────────────────────────────────
export async function getAlerts() {
  try {
    const { data } = await api.get("/alerts/map");
    return data;
  } catch {
    return { alerts: MOCK_ALERTS, total_scans: 484, active_regions: 10 };
  }
}

// ── Croply Bot — KisanBot (used in ResultsPage after scan) ───────────────────
// Powered by Groq (llama3-8b-8192). Has full disease context loaded.
export async function askKisanBot(message, context, language = "en") {
  const langInstructions =
    language === "hi"
      ? "Respond ONLY in Hindi (Devanagari script). Keep answers practical and brief. Max 80 words."
      : "Respond in simple English. Avoid jargon. Max 80 words.";

  const systemPrompt =
    "You are Croply Bot, an AI assistant for Indian farmers. " +
    langInstructions +
    " Farmer crop scan: disease=" +
    (context.disease || "") +
    ", crop=" +
    (context.crop || "") +
    ", severity=" +
    (context.severity || "") +
    "." +
    " Give practical advice. Mention safety precautions when relevant." +
    " If unsure, suggest consulting a local Krishi Vigyan Kendra (KVK).";

  return await callGroq({
    model: "llama-3.1-8b-instant",
    maxTokens: 200,
    system: systemPrompt,
    user: message,
    language,
  });
}

// ── NavBot AI — Floating assistant at bottom-right ───────────────────────────
// Powered by Groq (llama3-8b-8192). Answers general farming questions + guides navigation.
export async function askNavBot(message, language = "en") {
  const langInstructions =
    language === "hi"
      ? "Respond ONLY in Hindi (Devanagari script). Be concise — max 60 words."
      : "Respond in plain English. Be concise — max 60 words.";

  const systemPrompt =
    "You are Croply Assistant, a helpful AI for Indian farmers. " +
    langInstructions +
    " You can answer questions about crop diseases, farming techniques, fertilisers, pesticides, irrigation, weather, soil health, and government schemes for farmers." +
    " If a question is completely unrelated to farming or agriculture, politely say you can only help with farming topics." +
    " Suggest consulting a local Krishi Vigyan Kendra (KVK) for highly specialised issues." +
    " The app has: Scan Crop (AI disease detection), Alert Map (disease outbreaks by district), Scan History, and a Product Cart.";

  return await callGroq({
    model: "llama-3.1-8b-instant",
    maxTokens: 150,
    system: systemPrompt,
    user: message,
    language,
  });
}

// ── Shared Groq caller ────────────────────────────────────────────────────────
async function callGroq({ model, maxTokens, system, user, language }) {
  const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
  if (!GROQ_KEY) return getFallbackResponse(language);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + GROQ_KEY,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices?.[0]?.message?.content || getFallbackResponse(language);
  } catch (e) {
    console.warn("Groq error:", e);
    return getFallbackResponse(language);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const randomScanId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(",")[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

function getFallbackResponse(lang) {
  if (lang === "hi") {
    return "मैं अभी जवाब देने में असमर्थ हूं। कृपया अपने नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।";
  }
  return "I cannot connect right now. Please consult your local Krishi Vigyan Kendra (KVK) for expert advice.";
}

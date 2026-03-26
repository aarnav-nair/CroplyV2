import axios from 'axios'
import { MOCK_DETECTION, MOCK_PRODUCTS, MOCK_ALERTS, MOCK_DISEASES } from '../data/mockData.js'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const api = axios.create({ baseURL: API_BASE, timeout: 60000 })

// ── Auth token helpers ────────────────────────────────────────────────────────
export function saveToken(token) {
  try { localStorage.setItem('croply-token', token) } catch {}
}
export function loadToken() {
  try { return localStorage.getItem('croply-token') || null } catch { return null }
}
export function clearToken() {
  try { localStorage.removeItem('croply-token'); localStorage.removeItem('croply-user') } catch {}
}
export function saveUser(user) {
  try { localStorage.setItem('croply-user', JSON.stringify(user)) } catch {}
}
export function loadUser() {
  try { const s = localStorage.getItem('croply-user'); return s ? JSON.parse(s) : null } catch { return null }
}

// Attach token to every request automatically
api.interceptors.request.use(cfg => {
  const t = loadToken()
  if (t) cfg.headers['Authorization'] = `Bearer ${t}`
  return cfg
})

// ── Auth API ──────────────────────────────────────────────────────────────────
async function authPost(path, body) {
  try {
    const { data } = await api.post(path, body)
    return data
  } catch (err) {
    const msg = err.response?.data?.detail || err.message || 'Request failed'
    throw new Error(msg)
  }
}

export async function authRegister(name, email, phone, password) {
  const data = await authPost('/auth/register', { name, email, phone, password })
  saveToken(data.token); saveUser(data.user)
  return data
}

export async function authLogin(email, password) {
  const data = await authPost('/auth/login', { email, password })
  saveToken(data.token); saveUser(data.user)
  return data
}

export async function authGuest() {
  const data = await authPost('/auth/guest', {})
  saveToken(data.token); saveUser(data.user)
  return data
}

export async function authLogout() {
  clearToken()
}

// ── Disease Detection ─────────────────────────────────────────────────────────
export async function detectDisease(imageFile) {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

  // 1. If Gemini key is present, try real AI analysis first
  if (GEMINI_KEY) {
    try {
      return await detectWithGeminiVision(imageFile, GEMINI_KEY)
    } catch (e) {
      const msg = e.message || ''
      // Surface all Gemini errors instead of silently falling back to the backend mock
      console.error('Gemini API Error:', e)
      throw new Error(`Gemini Vision Error: ${msg || 'Unknown API failure'}`)
    }
  }

  // 2. Try the backend (which uses mock inference)
  try {
    const formData = new FormData()
    formData.append('file', imageFile)
    const { data } = await api.post('/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 8000,
    })
    return data
  } catch {}

  // 3. Last resort: hardcoded mock (offline demo)
  await delay(2200)
  
  // Return a random disease from MOCK_DISEASES instead of always Tomato Late Blight
  const randomDisease = MOCK_DISEASES ? MOCK_DISEASES[Math.floor(Math.random() * MOCK_DISEASES.length)] : null;
  if (randomDisease) {
    return {
      ...MOCK_DETECTION,
      scan_id: randomScanId(),
      disease_id: randomDisease.id,
      disease_name: randomDisease.name,
      crop: randomDisease.crop
    }
  }

  return { ...MOCK_DETECTION, scan_id: randomScanId() }
}

// ── Gemini Vision: Crop Disease Detection ─────────────────────────────────────
async function detectWithGeminiVision(imageFile, apiKey) {
  // Resize to max 1024px before encoding — large images hit Gemini's free-tier token limit
  const base64 = await fileToBase64Resized(imageFile, 1024)
  const mimeType = 'image/jpeg' // always send as JPEG after resize

  const prompt = `You are an expert agronomist AI. Analyse this crop leaf image and identify any disease.

Respond ONLY with valid JSON in exactly this format (no markdown, no extra text):
{
  "disease_name": "<name of disease, e.g. Leaf Blight>",
  "disease_name_hi": "<Hindi disease name>",
  "crop": "<name of crop, e.g. Potato>",
  "crop_hi": "<Hindi crop name>",
  "confidence": <confidence score between 50.0 and 99.9>,
  "severity": "<mild, moderate, or severe>",
  "pathogen": "<scientific name, if known>",
  "description": "<2 sentence plain description of what you see>",
  "description_hi": "<same in Hindi>",
  "causes": "<one sentence on cause>",
  "spread_rate": "<Fast, Moderate, or Slow>",
  "affected_parts": ["<affected part 1>", "<affected part 2>"]
}

severity must be one of: mild, moderate, severe
If no disease visible, use disease_name "Healthy Crop" with confidence below 60.
Supported crops: Tomato, Potato, Corn, Rice, Wheat, Apple, Grape, Pepper, Peach, Strawberry.`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    }
  )

  const data = await res.json()
  if (!res.ok || data.error) {
    const detail = data.error?.message || data.error?.status || res.statusText
    throw new Error(detail || `Gemini HTTP ${res.status}`)
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Gemini response: ' + text)

  const result = JSON.parse(jsonMatch[0])
  return {
    scan_id: randomScanId(),
    disease_id: (result.disease_name || 'unknown').toLowerCase().replace(/\s+/g, '_'),
    disease_name: result.disease_name || 'Unknown Disease',
    disease_name_hi: result.disease_name_hi || result.disease_name || '',
    crop: result.crop || 'Unknown',
    crop_hi: result.crop_hi || result.crop || '',
    confidence: Math.min(99, Math.max(50, Number(result.confidence) || 82)),
    severity: ['mild', 'moderate', 'severe'].includes(result.severity) ? result.severity : 'moderate',
    pathogen: result.pathogen || '',
    description: result.description || '',
    description_hi: result.description_hi || result.description || '',
    causes: result.causes || '',
    spread_rate: result.spread_rate || 'Moderate',
    affected_parts: result.affected_parts || ['Leaves'],
    timestamp: new Date().toISOString(),
  }
}

// ── Product Recommendations ───────────────────────────────────────────────────
export async function getRecommendations(scanIdOrResult) {
  const isObj = typeof scanIdOrResult === 'object' && scanIdOrResult !== null;
  const scanId = isObj ? scanIdOrResult.scan_id : scanIdOrResult;
  const diseaseName = isObj ? (scanIdOrResult.disease_name || '') : '';

  try {
    const { data } = await api.get('/recommendations/' + scanId)
    return data.products
  } catch {
    await delay(300)

    if (diseaseName.toLowerCase().includes('healthy')) return [];

    if (diseaseName) {
      return MOCK_PRODUCTS.map((p, i) => {
        const isOrg = p.classification === 'Organic';
        return {
          ...p,
          id: `${p.id}_${scanId}`,
          name: isOrg ? `Eco-Protect Bio-Formula (${diseaseName} Specific)` : `Targeted Shield ${['75% WP', '50% WG', '10% SC', 'Gold'][i % 4]} for ${diseaseName}`,
          why_recommended: isOrg 
            ? `Natural botanical extract that halts the progression of ${diseaseName}. Best for early stages and safe near harvest.`
            : `Systemic action targets the specific pathogens causing ${diseaseName}. Provides lasting protection for severe infections.`,
          price_per_unit: p.price_per_unit + (i * 25)
        };
      });
    }

    return MOCK_PRODUCTS
  }
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function listProducts() {
  try {
    const { data } = await api.get('/products')
    return data.products
  } catch {
    return MOCK_PRODUCTS
  }
}

// ── Place Order ───────────────────────────────────────────────────────────────
export async function placeOrder(orderPayload) {
  try {
    const { data } = await api.post('/orders', orderPayload)
    return data
  } catch {
    await delay(800)
    return {
      order_id: 'CRP-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      total_amount: orderPayload.total_amount || 0,
      status: 'confirmed',
      estimated_delivery: '3-5 business days',
      ...orderPayload,
    }
  }
}

// ── Alert Map ─────────────────────────────────────────────────────────────────
export async function getAlerts() {
  try {
    const { data } = await api.get('/alerts/map')
    return data
  } catch {
    return { alerts: MOCK_ALERTS, total_scans: 484, active_regions: 10 }
  }
}

// ── Chat logging — silently saves every exchange to the DB ───────────────────
// session_id is stable per browser tab (generated once, stored in sessionStorage)
function getSessionId() {
  try {
    let sid = sessionStorage.getItem('croply-session')
    if (!sid) { sid = Math.random().toString(36).slice(2, 10); sessionStorage.setItem('croply-session', sid) }
    return sid
  } catch { return 'unknown' }
}

async function logChat(role, message, { botType = 'navbot', language = 'en', disease, crop, severity } = {}) {
  try {
    await api.post('/chat/log', {
      session_id: getSessionId(),
      bot_type:   botType,
      role,
      message,
      language,
      disease:  disease  || null,
      crop:     crop     || null,
      severity: severity || null,
    })
  } catch { /* never block the UI for a logging failure */ }
}

// ── Croply Bot — KisanBot (used in ResultsPage after scan) ───────────────────
// Powered by Groq (llama3-8b-8192). Has full disease context loaded.
export async function askKisanBot(message, context, language = 'en') {
  const langInstructions = language === 'hi'
    ? 'Respond ONLY in Hindi (Devanagari script). Keep answers practical and brief. Max 80 words.'
    : 'Respond in simple English. Avoid jargon. Max 80 words.'

  const systemPrompt =
    'You are Croply Bot, an AI assistant for Indian farmers. ' +
    langInstructions +
    ' Farmer crop scan: disease=' + (context.disease || '') +
    ', crop=' + (context.crop || '') +
    ', severity=' + (context.severity || '') + '.' +
    ' Give practical advice. Mention safety precautions when relevant.' +
    ' If unsure, suggest consulting a local Krishi Vigyan Kendra (KVK).'

  // Log user prompt (fire-and-forget)
  logChat('user', message, { botType: 'kisanbot', language, ...context })

  const reply = await callGemini({ maxTokens: 200, system: systemPrompt, user: message })

  // Log bot reply
  logChat('bot', reply, { botType: 'kisanbot', language, ...context })

  return reply
}

// ── NavBot AI — Floating assistant at bottom-right ───────────────────────────
// Powered by Groq (llama3-8b-8192). Answers general farming questions + guides navigation.
export async function askNavBot(message, language = 'en') {
  const langInstructions = language === 'hi'
    ? 'Respond ONLY in Hindi (Devanagari script). Be concise — max 60 words.'
    : 'Respond in plain English. Be concise — max 60 words.'

  const systemPrompt =
    'You are Croply Assistant, a helpful AI for Indian farmers. ' +
    langInstructions +
    ' You can answer questions about crop diseases, farming techniques, fertilisers, pesticides, irrigation, weather, soil health, and government schemes for farmers.' +
    ' If a question is completely unrelated to farming or agriculture, politely say you can only help with farming topics.' +
    ' Suggest consulting a local Krishi Vigyan Kendra (KVK) for highly specialised issues.' +
    ' The app has: Scan Crop (AI disease detection), Alert Map (disease outbreaks by district), Scan History, and a Product Cart.'

  // Log user prompt
  logChat('user', message, { botType: 'navbot', language })

  const reply = await callGemini({ maxTokens: 150, system: systemPrompt, user: message })

  // Log bot reply
  logChat('bot', reply, { botType: 'navbot', language })

  return reply
}

// ── Shared Gemini chat caller ─────────────────────────────────────────────────
async function callGemini({ maxTokens, system, user }) {
  const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
  if (!GEMINI_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not set in your .env.local file.')
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
      }),
    }
  )

  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error('Gemini: ' + (data.error?.message || res.statusText))
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
const randomScanId = () => Math.random().toString(36).slice(2, 8).toUpperCase()

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
}

// Resize image to maxPx on the longest side and return as JPEG base64
// This keeps the payload small enough for Gemini's free tier
function fileToBase64Resized(file, maxPx = 1024) {
  return new Promise((res, rej) => {
    const reader = new FileReader()
    reader.onerror = rej
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = rej
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        // quality 0.85 keeps detail while cutting file size significantly
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        res(dataUrl.split(',')[1])
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function getFallbackResponse(lang) {
  if (lang === 'hi') {
    return 'मैं अभी जवाब देने में असमर्थ हूं। कृपया अपने नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।'
  }
  return 'I cannot connect right now. Please consult your local Krishi Vigyan Kendra (KVK) for expert advice.'
}
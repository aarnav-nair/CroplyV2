import axios from 'axios'
import { MOCK_DETECTION, MOCK_PRODUCTS, MOCK_ALERTS } from '../data/mockData.js'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const api = axios.create({ baseURL: API_BASE, timeout: 10000 })

// ── Disease Detection ─────────────────────────────────────────────────────────
export async function detectDisease(imageFile) {
  // Try real backend first
  try {
    const formData = new FormData()
    formData.append('file', imageFile)
    const { data } = await api.post('/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 8000,
    })
    return data
  } catch {}

  // Use Groq vision for real image analysis
  const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
  if (GROQ_KEY) {
    try {
      return await detectWithGrovVision(imageFile, GROQ_KEY)
    } catch (e) {
      console.warn('Groq vision failed:', e)
    }
  }

  // Last resort: mock
  await delay(2200)
  return { ...MOCK_DETECTION, scan_id: randomScanId() }
}

async function detectWithGrovVision(imageFile, apiKey) {
  const base64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

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
Supported crops: Tomato, Potato, Corn, Rice, Wheat, Apple, Grape, Pepper, Peach, Strawberry.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: 'data:' + mimeType + ';base64,' + base64 } }
        ]
      }]
    })
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error.message)

  const text = data.choices?.[0]?.message?.content || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in Groq response: ' + text)

  const result = JSON.parse(jsonMatch[0])
  return {
    scan_id: randomScanId(),
    disease_id: (result.disease_name || 'unknown').toLowerCase().replace(/\s+/g, '_'),
    disease_name: result.disease_name || 'Unknown Disease',
    disease_name_hi: result.disease_name_hi || result.disease_name || '',
    crop: result.crop || 'Unknown',
    crop_hi: result.crop_hi || result.crop || '',
    confidence: Math.min(99, Math.max(50, Number(result.confidence) || 82)),
    severity: ['mild','moderate','severe'].includes(result.severity) ? result.severity : 'moderate',
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
export async function getRecommendations(scanId) {
  try {
    const { data } = await api.get('/recommendations/' + scanId)
    return data.products
  } catch {
    await delay(300)
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

// ── Croply Bot (Groq Llama 3) ─────────────────────────────────────────────────
export async function askKisanBot(message, context, language = 'en') {
  const langInstructions = language === 'hi'
    ? 'Respond ONLY in Hindi (Devanagari script). Keep answers practical and brief. Max 80 words.'
    : 'Respond in simple English. Avoid jargon. Max 80 words.'

  const systemPrompt = 'You are Croply Bot, an AI assistant for Indian farmers. ' +
    langInstructions +
    ' Farmer crop scan: disease=' + (context.disease||'') +
    ', crop=' + (context.crop||'') +
    ', severity=' + (context.severity||'') + '.' +
    ' Give practical advice. Mention safety precautions when relevant.' +
    ' If unsure, suggest consulting a local Krishi Vigyan Kendra (KVK).'

  const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY
  if (!GROQ_KEY) return getFallbackResponse(message, language)

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_KEY,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content || getFallbackResponse(message, language)
  } catch {
    return getFallbackResponse(message, language)
  }
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

function getFallbackResponse(message, lang) {
  if (lang === 'hi') {
    return 'मैं अभी जवाब देने में असमर्थ हूं। कृपया अपने नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।'
  }
  return 'I cannot connect right now. Please consult your local Krishi Vigyan Kendra (KVK) for expert advice.'
}

import { useState, useEffect } from 'react'
import { MapPin, Thermometer, Droplets, Wind, CloudRain, Loader2, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'

// ── Open-Meteo fetch (no API key needed) ──────────────────────────────────────
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
    `&timezone=auto`
  const res = await fetch(url)
  const data = await res.json()
  return data.current
}

// Free reverse geocoding via Nominatim (no key)
async function fetchDistrict(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { 'Accept-Language': 'en' } }
  )
  const data = await res.json()
  const addr = data.address || {}
  return addr.county || addr.state_district || addr.city || addr.town || addr.village || 'Your Location'
}

// ── Advisory engine ───────────────────────────────────────────────────────────
// WMO weather codes: 51-67 = drizzle/rain, 80-99 = showers/storms
function isRaining(code) { return (code >= 51 && code <= 67) || (code >= 80 && code <= 99) }

function getAdvisory(weather, lang) {
  const hi = lang === 'hi'
  const { relative_humidity_2m: hum, precipitation: rain, wind_speed_10m: wind, weather_code: code } = weather

  if (isRaining(code) || rain > 0.3) {
    return {
      level: 'danger',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.25)',
      icon: CloudRain,
      text: hi
        ? `बारिश हो रही है — आज छिड़काव न करें। कल सुबह उपचार करें।`
        : `Rain detected — avoid spraying today. Reschedule treatment for tomorrow morning.`,
    }
  }
  if (hum >= 82 || (hum >= 75 && wind < 8)) {
    return {
      level: 'warning',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.25)',
      icon: AlertTriangle,
      text: hi
        ? `उमस अधिक है (${hum}%) — रोग फैलने का खतरा ज़्यादा। शाम से पहले उपचार करें।`
        : `High humidity (${hum}%) — disease spread risk elevated. Apply treatment before evening.`,
    }
  }
  if (wind >= 20) {
    return {
      level: 'warning',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.25)',
      icon: AlertTriangle,
      text: hi
        ? `तेज़ हवा (${wind} km/h) — छिड़काव से बचें, दवा उड़ जाएगी। हवा कम होने पर करें।`
        : `Strong winds (${wind} km/h) — avoid spraying, product will drift. Wait for calmer conditions.`,
    }
  }
  return {
    level: 'good',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.22)',
    icon: CheckCircle,
    text: hi
      ? `आज मौसम अनुकूल है — छिड़काव के लिए अच्छा समय।`
      : `Good conditions today — low disease spread risk. Good window for treatment.`,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WeatherBar({ lang }) {
  const hi = lang === 'hi'
  const [state, setState] = useState('loading') // loading | ready | error | denied
  const [weather, setWeather] = useState(null)
  const [district, setDistrict] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) { setState('error'); return }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const [w, d] = await Promise.all([
            fetchWeather(coords.latitude, coords.longitude),
            fetchDistrict(coords.latitude, coords.longitude),
          ])
          setWeather(w)
          setDistrict(d)
          setState('ready')
        } catch {
          setState('error')
        }
      },
      () => setState('denied'),
      { timeout: 8000 }
    )
  }, [])

  // ── States: loading ────────────────────────────────────────────────────────
  if (state === 'loading') return (
    <div className="w-full" style={{ background: 'rgba(14,20,12,0.92)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="container h-9 flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'rgba(255,255,255,0.35)' }} />
        <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {hi ? 'मौसम जानकारी लोड हो रही है…' : 'Fetching weather for your location…'}
        </span>
      </div>
    </div>
  )

  // ── States: error / denied ─────────────────────────────────────────────────
  if (state === 'error' || state === 'denied') return (
    <div className="w-full" style={{ background: 'rgba(14,20,12,0.92)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="container h-9 flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
        <span className="font-body text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {state === 'denied'
            ? (hi ? 'स्थान अनुमति दें — मौसम सलाह के लिए' : 'Enable location for weather-based disease advice')
            : (hi ? 'मौसम जानकारी उपलब्ध नहीं' : 'Weather data unavailable')}
        </span>
      </div>
    </div>
  )

  // ── State: ready ───────────────────────────────────────────────────────────
  const adv = getAdvisory(weather, lang)
  const AdvIcon = adv.icon
  const { temperature_2m: temp, relative_humidity_2m: hum, wind_speed_10m: wind } = weather

  return (
    <div
      className="w-full sticky top-[62px] z-40"
      style={{
        background: 'rgba(10,15,10,0.96)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${adv.border}`,
      }}
    >
      <div className="container h-10 flex items-center gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>

        {/* Location */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <MapPin className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.4)' }} />
          <span className="font-body text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {district}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Weather stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Stat icon={Thermometer} val={`${Math.round(temp)}°C`} />
          <Stat icon={Droplets}    val={`${hum}%`} />
          <Stat icon={Wind}        val={`${Math.round(wind)} km/h`} />
        </div>

        {/* Divider */}
        <div className="w-px h-4 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Advisory pill */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full flex-shrink-0"
          style={{ background: adv.bg, border: `1px solid ${adv.border}` }}
        >
          <AdvIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: adv.color }} />
          <span className="font-body text-xs font-semibold" style={{ color: adv.color }}>
            {adv.text}
          </span>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, val }) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
      <span className="font-body text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>{val}</span>
    </div>
  )
}
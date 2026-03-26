import { useState, useEffect } from 'react'
import { MapPin, Thermometer, Droplets, Wind, CloudRain, CheckCircle, AlertTriangle, Zap } from 'lucide-react'

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
    `&timezone=auto`
  const res = await fetch(url)
  return (await res.json()).current
}

async function fetchDistrict(lat, lon) {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, { headers: { 'Accept-Language': 'en' } })
  const addr = (await res.json()).address || {}
  return addr.county || addr.state_district || addr.city || addr.town || addr.village || 'Your Farm'
}

function isRaining(code) { return (code >= 51 && code <= 67) || (code >= 80 && code <= 99) }

function getAdvisory(weather, lang) {
  const hi = lang === 'hi'
  const { relative_humidity_2m: hum, precipitation: rain, wind_speed_10m: wind, weather_code: code } = weather

  if (isRaining(code) || rain > 0.3) {
    return { level: 'danger', color: '#ef4444', icon: CloudRain, text: hi ? `बारिश हो रही है — अभी छिड़काव न करें।` : `It's raining — don't spray now.` }
  }
  if (hum >= 82 || (hum >= 75 && wind < 8)) {
    return { level: 'warning', color: '#fbbf24', icon: AlertTriangle, text: hi ? `उच्च आर्द्रता (${hum}%) — बीमारी का खतरा।` : `High humidity (${hum}%) — watch for diseases.` }
  }
  if (wind >= 20) {
    return { level: 'warning', color: '#fbbf24', icon: Zap, text: hi ? `तेज़ हवा (${wind} km/h) — छिड़काव प्रवहण।` : `Strong wind (${wind} km/h) — spraying may drift.` }
  }
  return { level: 'good', color: '#22c55e', icon: CheckCircle, text: hi ? `अच्छा मौसम — छिड़काव के लिए सुरक्षित।` : `Good weather — safe to work / spray.` }
}

export default function WeatherBar({ lang }) {
  const [state, setState] = useState('loading')
  const [weather, setWeather] = useState(null)
  const [district, setDistrict] = useState('')

  useEffect(() => {
    if (!navigator.geolocation) { setState('error'); return }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const [w, d] = await Promise.all([fetchWeather(coords.latitude, coords.longitude), fetchDistrict(coords.latitude, coords.longitude)])
          setWeather(w); setDistrict(d); setState('ready')
        } catch { setState('error') }
      },
      () => setState('denied'),
      { timeout: 8000 }
    )
  }, [])

  if (state === 'loading') return null

  if (state === 'ready') {
    const adv = getAdvisory(weather, lang)
    const { temperature_2m: temp, relative_humidity_2m: hum, wind_speed_10m: wind } = weather
    const AdvIcon = adv.icon

    return (
      <div className="w-[96%] md:w-max max-w-3xl mx-auto bg-surface/90 backdrop-blur-md border border-primary/10 rounded-full shadow-sm sticky top-[90px] md:top-[100px] z-30 overflow-hidden mb-4">
        <div className="px-6 h-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">{district}</span>
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
               <span className="text-[10px] font-bold text-primary/60 flex items-center gap-1.5">
                 <Thermometer className="w-3.5 h-3.5 text-accent" /> {Math.round(temp)}°C
               </span>
               <span className="text-[10px] font-bold text-primary/60 flex items-center gap-1.5">
                 <Droplets className="w-3.5 h-3.5 text-blue-400" /> {hum}%
               </span>
               <span className="text-[10px] font-bold text-primary/60 flex items-center gap-1.5">
                 <Wind className="w-3.5 h-3.5 text-gray-400" /> {Math.round(wind)}km/h
               </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 pl-4 border-l border-primary/10">
             <AdvIcon className="w-4 h-4" style={{ color: adv.color }} />
             <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: adv.color }}>{adv.text}</span>
          </div>
        </div>
      </div>
    )
  }


  return null
}
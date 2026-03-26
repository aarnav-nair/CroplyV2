import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getAlerts } from '../services/api.js'
import { MapPin, AlertTriangle, X, Activity, Cloud, Thermometer, Droplets, Wind, ChevronDown, ChevronUp, Radar, ShieldAlert, Target } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Constants ────────────────────────────────────────────────────────────────

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const staggerContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }

const SEV = {
  mild:     { hex:'#22c55e', label:'Safe',       badge:'badge-green',   radius:10 },
  moderate: { hex:'#eab308', label:'Needs Care', badge:'badge-amber',   radius:14 },
  severe:   { hex:'#ef4444', label:'Serious',    badge:'badge-red',     radius:18 },
}

const DISEASE_INFO = {
  'Tomato Late Blight':  { pathogen:'Phytophthora infestans', spread:'Very Fast', favTemp:'10–25°C', favHum:'>80%', prevention:'Apply fungicide before rain. Remove infected leaves.', treatment:'Metalaxyl + Mancozeb, Copper Oxychloride', risk:(t,h)=>h>75&&t<24?'high':h>60?'moderate':'low' },
  'Potato Late Blight':  { pathogen:'Phytophthora infestans', spread:'Very Fast', favTemp:'10–25°C', favHum:'>80%', prevention:'Hill up soil around tubers. Preventive sprays every 7 days.', treatment:'Metalaxyl + Mancozeb, Cymoxanil', risk:(t,h)=>h>75&&t<24?'high':h>60?'moderate':'low' },
  'Wheat Leaf Rust':     { pathogen:'Puccinia triticina',     spread:'Fast',      favTemp:'15–22°C', favHum:'>60%', prevention:'Use resistant varieties. Apply triazole at flag leaf stage.', treatment:'Propiconazole 25% EC, Tebuconazole + Trifloxystrobin', risk:(t,h)=>h>60&&t>=15&&t<=22?'high':h>50?'moderate':'low' },
  'Rice Blast':          { pathogen:'Magnaporthe oryzae',     spread:'Very Fast', favTemp:'24–28°C', favHum:'>90%', prevention:'Avoid excess nitrogen. Apply at tillering and panicle stage.', treatment:'Tricyclazole 75% WP (ICAR), Propiconazole 25% EC', risk:(t,h)=>h>85&&t>=24?'high':h>70?'moderate':'low' },
  'Tomato Early Blight': { pathogen:'Alternaria solani',      spread:'Moderate',  favTemp:'24–29°C', favHum:'>70%', prevention:'Crop rotation. Avoid overhead irrigation.', treatment:'Chlorothalonil 75% WP, Mancozeb 75% WP', risk:(t,h)=>h>70&&t>=24?'high':h>55?'moderate':'low' },
  'Corn Common Rust':    { pathogen:'Puccinia sorghi',        spread:'Fast',      favTemp:'16–23°C', favHum:'>60%', prevention:'Plant resistant hybrids. Apply strobilurin at first sign.', treatment:'Propiconazole 25% EC, Trifloxystrobin WG', risk:(t,h)=>h>60&&t>=16&&t<=23?'high':h>45?'moderate':'low' },
}

const WX_CODES = { 0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',51:'Light drizzle',61:'Slight rain',63:'Rain',65:'Heavy rain',80:'Rain showers',95:'Thunderstorm' }

// ── Helpers ──────────────────────────────────────────────────────────────────

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], target.zoom||6, { duration:1.0 })
  }, [target])
  return null
}

async function fetchWeather(lat, lng) {
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,apparent_temperature&timezone=auto`)
  const d = await r.json()
  return d.current
}

// ── Components ───────────────────────────────────────────────────────────────

function OutbreakPopup({ alert, lang }) {
  const [wx, setWx]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('overview')
  const info = DISEASE_INFO[alert.disease] || {}

  useEffect(() => {
    async function loadWx() {
      setLoading(true)
      try { setWx(await fetchWeather(alert.lat, alert.lng)) }
      catch { setWx(null) }
      finally { setLoading(false) }
    }
    loadWx()
  }, [alert])

  const t = wx?.temperature_2m, h = wx?.relative_humidity_2m
  const riskLevel = info.risk && wx ? info.risk(t, h) : null
  const riskColors = { high:['#FEE2E2','#991B1B','CRITICAL'], moderate:['#FEF3C7','#92400E','ELEVATED'], low:['#DCFCE7','#166534','MINIMAL'] }
  const [rBg, rFg, rLabel] = riskColors[riskLevel] || ['#F3F4F6','#374151','UNKNOWN']

  return (
    <div className="font-outfit text-dark min-w-[320px] p-1">
      <div className="flex justify-between items-start gap-4 mb-5">
        <div>
          <h4 className="text-xl font-bold tracking-tight mb-1 text-dark">{alert.disease}</h4>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{alert.district}, {alert.state}</p>
        </div>
        <div className={`badge ${SEV[alert.severity]?.badge} shadow-sm px-3 py-1 text-[10px] font-bold`}>
          {SEV[alert.severity]?.label}
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-3 mb-4">
        {['Details', 'Weather', 'How to fix'].map((label, idx) => {
          const ids = ['overview', 'weather', 'treatment']
          const id = ids[idx]
          return (
            <button key={id} onClick={() => setTab(id)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl
                              ${tab === id ? 'bg-primary text-white shadow-md scale-105' : 'bg-surface text-muted hover:text-dark border border-border'}`}>
              {label}
            </button>
          )
        })}
      </div>

      {tab === 'overview' && (
        <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="space-y-4">
          <div className="flex gap-3">
             <div className="flex-1 bg-surface p-4 rounded-2xl border border-border shadow-sm">
                <p className="text-[9px] font-black text-muted uppercase mb-1">Affected Area</p>
                <p className="text-xl font-bold text-primary tracking-tight">{alert.count} Farmers</p>
             </div>
             <div className="flex-1 bg-surface p-4 rounded-2xl border border-border shadow-sm">
                <p className="text-[9px] font-black text-muted uppercase mb-1">Risk Level</p>
                <p className={`text-base font-bold ${riskLevel === 'high' ? 'text-red-500' : 'text-primary'}`}>{rLabel}</p>
             </div>
          </div>
          <p className="text-xs font-medium text-dark leading-relaxed bg-surface p-4 rounded-2xl border border-border">
            <span className="text-primary font-black uppercase tracking-wider text-[10px]">Cause:</span> {info.pathogen}<br/>
            <span className="text-primary font-black uppercase tracking-wider text-[10px] mt-2 inline-block">Spread:</span> {info.spread} Rate
          </p>
        </motion.div>
      )}

      {tab === 'weather' && (
        <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="space-y-3">
          {loading ? <p className="text-center py-6 text-[10px] font-black text-muted uppercase tracking-widest animate-pulse">Syncing Meteo Data...</p> : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Temp', val: `${Math.round(t)}°C` },
                { label: 'Humidity', val: `${h}%` },
                { label: 'Wind', val: `${Math.round(wx?.wind_speed_10m)} km/h` },
                { label: 'Condition', val: WX_CODES[wx?.weather_code] || 'Stable' }
              ].map(d => (
                <div key={d.label} className="bg-surface p-3 rounded-2xl border border-border shadow-sm">
                  <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">{d.label}</p>
                  <p className="text-base font-bold text-dark">{d.val}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {tab === 'treatment' && (
        <motion.div initial={{opacity:0, y:5}} animate={{opacity:1, y:0}} className="bg-primary/5 text-dark p-5 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none" />
          <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">What to do</h5>
          <p className="text-sm font-medium leading-relaxed relative z-10">{info.treatment}</p>
        </motion.div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AlertMapPage({ lang }) {
  const [data, setData]           = useState(null)
  const [statesGeo, setStatesGeo] = useState(null)
  const [filter, setFilter]       = useState('all')
  const [flyTarget, setFlyTarget] = useState({lat:22.5,lng:80.5,zoom:5})
  const [selectedState, setSelectedState] = useState(null)
  const [stateFilter, setStateFilter] = useState(null)

  useEffect(() => {
    const URLS = [
      'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson',
      'https://raw.githubusercontent.com/datameet/maps/master/States/Admin2.geojson',
    ]
    async function loadGeo() {
      for (const url of URLS) {
        try {
          const r = await fetch(url)
          if (!r.ok) continue
          const geo = await r.json()
          if (geo.features) {
            geo.features = geo.features.map(f => ({
              ...f,
              properties: {
                ...f.properties,
                name: f.properties.NAME_1 || f.properties.ST_NM || f.properties.name || f.properties.NAME || ''
              }
            }))
          }
          setStatesGeo(geo)
          return
        } catch {}
      }
    }
    loadGeo()
    getAlerts().then(setData)
  }, [])

  const STATE_CENTERS = {
    'Rajasthan':{lat:27.0,lng:74.2},'Uttar Pradesh':{lat:27.1,lng:80.9},'Madhya Pradesh':{lat:23.5,lng:77.6},
    'Maharashtra':{lat:19.7,lng:75.7},'West Bengal':{lat:23.8,lng:87.8},'Bihar':{lat:25.6,lng:85.1},
    'Haryana':{lat:29.1,lng:76.1},'Punjab':{lat:31.1,lng:75.3},'Gujarat':{lat:22.3,lng:71.2},
    'Karnataka':{lat:15.3,lng:75.7},'Andhra Pradesh':{lat:15.9,lng:79.7},'Telangana':{lat:17.1,lng:79.0},
    'Tamil Nadu':{lat:11.1,lng:78.7},'Kerala':{lat:10.9,lng:76.3},'Odisha':{lat:20.9,lng:84.5},
    'Chhattisgarh':{lat:21.3,lng:81.9},'Jharkhand':{lat:23.6,lng:85.3},
    'Himachal Pradesh':{lat:31.8,lng:77.2},'Uttarakhand':{lat:30.1,lng:79.2},'Delhi':{lat:28.6,lng:77.2},
  }

  const getStateStyle = useCallback((feature) => {
    const isSelected = selectedState === feature.properties.name
    return {
      fillColor: isSelected ? '#16a34a' : 'transparent',
      fillOpacity: isSelected ? 0.3 : 0,
      color: isSelected ? '#16a34a' : 'rgba(255,255,255,0.15)',
      weight: isSelected ? 3 : 1,
    }
  }, [selectedState])

  if (!data) return (
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
      <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-8 relative">
         <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
         <Radar className="w-10 h-10 text-primary animate-spin" strokeWidth={2} />
      </div>
      <h2 className="text-2xl font-bold text-dark animate-pulse tracking-tight">Scanning Grid...</h2>
    </div>
  )

  const allAlerts = data.alerts
  const filtered = allAlerts.filter(a => {
    const sevOk   = filter==='all' || a.severity===filter
    const stateOk = !stateFilter || a.state===stateFilter || stateFilter.includes(a.state) || a.state.includes(stateFilter)
    return sevOk && stateOk
  })

  return (
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)]">
      <div className="container max-w-[1400px] pt-6">
        <motion.header initial="hidden" animate="show" variants={fadeUp} className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-surface shadow-sm mb-6">
               <ShieldAlert className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Crop Health Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-dark tracking-tight mb-3">{lang === 'hi' ? 'अलर्ट मैप' : 'Regional Alerts'}</h1>
            <p className="text-muted font-medium text-lg tracking-wide">Track agricultural threats across the region</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-surface p-3 md:p-4 rounded-3xl shadow-xl shadow-primary/5 border border-border">
             <div className="flex items-center gap-2 md:gap-3 pr-4 border-r border-border">
                <span className="text-[10px] font-black uppercase text-muted tracking-widest ml-1 hidden sm:block">Filter:</span>
                {['all', 'mild', 'moderate', 'severe'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} 
                          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all
                                    ${filter === f ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-surface text-muted hover:text-dark border-transparent'}`}>
                    {f}
                  </button>
                ))}
             </div>
             <select 
               value={stateFilter || ''} 
               onChange={e => {
                 const v = e.target.value; setStateFilter(v || null); setSelectedState(v || null);
                 if (v) setFlyTarget({ ...STATE_CENTERS[v], zoom: 6 })
                 else setFlyTarget({lat:22.5,lng:80.5,zoom:5})
               }}
               className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer text-primary pl-2"
             >
               <option value="">Region: All India</option>
               {[...new Set(allAlerts.map(a => a.state))].sort().map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
        </motion.header>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-8 pb-20">
          
          {/* Main Map Grid */}
          <motion.div variants={fadeUp} className="w-full bg-surface p-3 rounded-[40px] shadow-xl shadow-primary/5 border border-border relative" style={{ height: '700px' }}>
            <div className="absolute top-8 left-8 z-[400] flex flex-col gap-3 pointer-events-none">
               <div className="bg-dark/80 backdrop-blur-md text-white p-4 rounded-2xl shadow-xl border border-white/10">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-2">Satellite Sync</p>
                  <div className="flex items-center gap-3">
                     <span className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_15px_#16a34a]" />
                     <span className="text-xs font-bold uppercase tracking-wider">Connected</span>
                  </div>
               </div>
            </div>

            <div className="w-full h-full rounded-[32px] overflow-hidden border border-border/50">
                <MapContainer center={[22.5, 80.5]} zoom={5} style={{ height: '100%', width: '100%', background: '#0a0a0a' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
                {statesGeo && <GeoJSON data={statesGeo} style={getStateStyle} onEachFeature={(f, l) => {
                    l.on('click', () => { setSelectedState(f.properties.name); setFlyTarget({ ...STATE_CENTERS[f.properties.name], zoom: 6 }) });
                    l.bindTooltip(f.properties.name, { sticky: true, className: 'state-tooltip font-bold text-[10px] uppercase tracking-widest p-2 rounded-lg' });
                }} />}
                <FlyTo target={flyTarget} />
                {filtered.map((alert, i) => (
                    <CircleMarker key={i} center={[alert.lat, alert.lng]} radius={SEV[alert.severity].radius} pathOptions={{ fillColor: SEV[alert.severity].hex, fillOpacity: 0.9, color: 'rgba(255,255,255,0.3)', weight: 3 }}>
                    <Popup className="custom-popup" minWidth={320}><OutbreakPopup alert={alert} lang={lang} /></Popup>
                    </CircleMarker>
                ))}
                </MapContainer>
            </div>
          </motion.div>

          {/* Intelligence Feed */}
          <motion.div variants={fadeUp} className="space-y-6 lg:max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-dark mb-6 flex items-center gap-3 bg-surface p-4 rounded-2xl border border-border shadow-sm sticky top-0 z-10">
               <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary" />
               </div>
               Live Feed
            </h3>
            
            <AnimatePresence>
            {filtered.sort((a,b) => b.count - a.count).map((alert, i) => (
              <motion.button 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                key={i}
                onClick={() => { setSelectedState(alert.state); setFlyTarget({ lat: alert.lat, lng: alert.lng, zoom: 7 }) }}
                className="w-full card p-6 bg-surface hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-primary/5 text-left border-none rounded-[32px] overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-surface rounded-full blur-xl -mr-8 -mt-8 pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                
                <div className="flex justify-between items-start mb-5 relative z-10">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-white shadow-sm`} style={{background: SEV[alert.severity].hex}}>
                      <Target className="w-5 h-5 text-white" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 bg-surface px-2 py-1 rounded-md">ID-{alert.id || i+100}</span>
                </div>
                
                <h4 className="text-2xl font-bold mb-2 text-dark group-hover:text-primary transition-colors relative z-10">{alert.disease}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-6 flex items-center gap-1.5 relative z-10">
                  <MapPin className="w-3 h-3" />
                  {alert.district}, {alert.state}
                </p>
                
                <div className="p-4 bg-surface border border-border rounded-2xl relative z-10">
                   <div className="flex justify-between items-center text-dark">
                      <span className="text-[9px] font-black uppercase tracking-widest">{alert.count} Farmers</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${alert.severity === 'severe' ? 'text-red-500' : 'text-primary'}`}>{alert.severity}</span>
                   </div>
                </div>
              </motion.button>
            ))}
            </AnimatePresence>
            
            {filtered.length === 0 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card border-2 border-dashed border-border p-12 text-center bg-transparent">
                  <Radar className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted">No Threats Detected</p>
               </motion.div>
            )}
          </motion.div>
        </motion.div>

      </div>
    </div>
  )
}

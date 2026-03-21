import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
// India states GeoJSON loaded at runtime from CDN (real boundaries, not hand-drawn)
import { getAlerts } from '../services/api.js'
import { MapPin, AlertTriangle, X, Activity, Cloud, Thermometer, Droplets, Wind, ChevronDown, ChevronUp } from 'lucide-react'

// ── Constants ────────────────────────────────────────────────────────────────


const SEV = {
  mild:     { hex:'#EAB308', label:'Mild',     badge:'badge-neutral', radius:10 },
  moderate: { hex:'#F97316', label:'Moderate', badge:'badge-amber',   radius:14 },
  severe:   { hex:'#EF4444', label:'Severe',   badge:'badge-red',     radius:18 },
}


const DISEASE_INFO = {
  'Tomato Late Blight':  { pathogen:'Phytophthora infestans', spread:'Very Fast', favTemp:'10–25°C', favHum:'>80%', prevention:'Apply fungicide before rain. Remove infected leaves.', treatment:'Metalaxyl + Mancozeb, Copper Oxychloride', risk:(t,h)=>h>75&&t<24?'high':h>60?'moderate':'low' },
  'Potato Late Blight':  { pathogen:'Phytophthora infestans', spread:'Very Fast', favTemp:'10–25°C', favHum:'>80%', prevention:'Hill up soil around tubers. Preventive sprays every 7 days.', treatment:'Metalaxyl + Mancozeb, Cymoxanil', risk:(t,h)=>h>75&&t<24?'high':h>60?'moderate':'low' },
  'Wheat Leaf Rust':     { pathogen:'Puccinia triticina',     spread:'Fast',      favTemp:'15–22°C', favHum:'>60%', prevention:'Use resistant varieties. Apply triazole at flag leaf stage.', treatment:'Propiconazole 25% EC, Tebuconazole + Trifloxystrobin', risk:(t,h)=>h>60&&t>=15&&t<=22?'high':h>50?'moderate':'low' },
  'Rice Blast':          { pathogen:'Magnaporthe oryzae',     spread:'Very Fast', favTemp:'24–28°C', favHum:'>90%', prevention:'Avoid excess nitrogen. Apply at tillering and panicle stage.', treatment:'Tricyclazole 75% WP (ICAR), Propiconazole 25% EC', risk:(t,h)=>h>85&&t>=24?'high':h>70?'moderate':'low' },
  'Tomato Early Blight': { pathogen:'Alternaria solani',      spread:'Moderate',  favTemp:'24–29°C', favHum:'>70%', prevention:'Crop rotation. Avoid overhead irrigation.', treatment:'Chlorothalonil 75% WP, Mancozeb 75% WP', risk:(t,h)=>h>70&&t>=24?'high':h>55?'moderate':'low' },
  'Corn Common Rust':    { pathogen:'Puccinia sorghi',        spread:'Fast',      favTemp:'16–23°C', favHum:'>60%', prevention:'Plant resistant hybrids. Apply strobilurin at first sign.', treatment:'Propiconazole 25% EC, Trifloxystrobin WG', risk:(t,h)=>h>60&&t>=16&&t<=23?'high':h>45?'moderate':'low' },
}

const STATE_FACTS = {
  'Rajasthan':      { area:'342,239 km²', majorCrops:'Wheat, Mustard, Bajra, Jowar', climate:'Arid/Semi-arid', avgRainfall:'313 mm/yr', tip:'Low humidity limits fungal spread but drought stress weakens crops.' },
  'Punjab':         { area:'50,362 km²',  majorCrops:'Wheat, Rice, Maize',           climate:'Semi-arid',     avgRainfall:'649 mm/yr', tip:'High wheat density makes rust disease spread rapid across the state.' },
  'Haryana':        { area:'44,212 km²',  majorCrops:'Wheat, Rice, Sugarcane',       climate:'Semi-arid',     avgRainfall:'614 mm/yr', tip:'Post-monsoon humidity creates ideal conditions for late season diseases.' },
  'Uttar Pradesh':  { area:'240,928 km²', majorCrops:'Wheat, Rice, Sugarcane, Potato', climate:'Subtropical', avgRainfall:'899 mm/yr', tip:'Largest potato producing state — Late Blight is a persistent risk.' },
  'Bihar':          { area:'94,163 km²',  majorCrops:'Rice, Wheat, Maize, Vegetables', climate:'Subtropical', avgRainfall:'1,205 mm/yr', tip:'High humidity during Kharif season elevates Rice Blast risk.' },
  'West Bengal':    { area:'88,752 km²',  majorCrops:'Rice, Jute, Tea, Potato',      climate:'Tropical',      avgRainfall:'1,750 mm/yr', tip:'Highest rainfall among outbreak states — severe blast conditions common.' },
  'Maharashtra':    { area:'307,713 km²', majorCrops:'Cotton, Sugarcane, Soybean, Onion', climate:'Tropical', avgRainfall:'1,000 mm/yr', tip:'Nashik district: tomato hub facing Early Blight during humid periods.' },
  'Madhya Pradesh': { area:'308,252 km²', majorCrops:'Wheat, Soybean, Maize, Pulses', climate:'Subtropical', avgRainfall:'1,117 mm/yr', tip:'Central location makes it a corridor for airborne rust spore movement.' },
  'Gujarat':        { area:'196,024 km²', majorCrops:'Cotton, Groundnut, Wheat, Tobacco', climate:'Semi-arid', avgRainfall:'820 mm/yr', tip:'Moderate humidity — disease pressure is lower than eastern states.' },
  'Karnataka':      { area:'191,791 km²', majorCrops:'Rice, Ragi, Maize, Tomato',    climate:'Tropical',      avgRainfall:'1,139 mm/yr', tip:'Dharwad district sees tomato blight during high-humidity months.' },
}

const WX_CODES = { 0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',51:'Light drizzle',61:'Slight rain',63:'Rain',65:'Heavy rain',80:'Rain showers',95:'Thunderstorm' }

// ── Fly controller ────────────────────────────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    map.flyTo([target.lat, target.lng], target.zoom||6, { duration:1.0 })
  }, [target])
  return null
}

// ── Weather fetch (Open-Meteo, no key needed) ─────────────────────────────────
async function fetchWeather(lat, lng) {
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,apparent_temperature&timezone=auto`)
  const d = await r.json()
  return d.current
}

// ── Marker popup ──────────────────────────────────────────────────────────────
function OutbreakPopup({ alert }) {
  const [wx, setWx]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('overview')
  const info = DISEASE_INFO[alert.disease] || {}

  async function loadWx() {
    if (wx || loading) return
    setLoading(true)
    try { setWx(await fetchWeather(alert.lat, alert.lng)) }
    catch { setWx(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadWx() }, [])

  const t = wx?.temperature_2m, h = wx?.relative_humidity_2m
  const riskLevel = info.risk && wx ? info.risk(t, h) : null
  const riskColors = { high:['#FEE2E2','#991B1B','🔴 High risk'], moderate:['#FEF3C7','#92400E','🟡 Moderate risk'], low:['#DCFCE7','#166534','🟢 Low risk'] }
  const [rBg, rFg, rLabel] = riskColors[riskLevel] || ['#F3F4F6','#374151','Unknown']

  const S = { fontFamily:'Outfit,sans-serif', fontSize:'12px' }

  return (
    <div style={{...S, width:'268px', lineHeight:'1.5'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'8px',marginBottom:'8px'}}>
        <div>
          <p style={{fontWeight:800,fontSize:'14px',color:'#141A10',margin:'0 0 2px'}}>{alert.disease}</p>
          <p style={{fontSize:'11px',color:'#6B7280',margin:0}}>📍 {alert.district}, {alert.state}</p>
        </div>
        <span style={{background:alert.severity==='severe'?'#FEE2E2':alert.severity==='moderate'?'#FEF3C7':'#F3F4F6',color:alert.severity==='severe'?'#991B1B':alert.severity==='moderate'?'#92400E':'#374151',padding:'2px 8px',borderRadius:'999px',fontSize:'11px',fontWeight:700,flexShrink:0}}>
          {SEV[alert.severity]?.label}
        </span>
      </div>

      <div style={{display:'flex',gap:'6px',marginBottom:'8px'}}>
        <div style={{flex:1,background:'#F5F3EE',borderRadius:'8px',padding:'5px 8px',textAlign:'center'}}>
          <p style={{fontWeight:800,fontSize:'17px',color:'#1E4D2B',margin:0}}>{alert.count}</p>
          <p style={{fontSize:'10px',color:'#6B7280',margin:0}}>farmers affected</p>
        </div>
        {riskLevel && (
          <div style={{flex:1,background:rBg,borderRadius:'8px',padding:'5px 8px',textAlign:'center'}}>
            <p style={{fontWeight:800,fontSize:'12px',color:rFg,margin:0,lineHeight:1.3}}>{rLabel}</p>
            <p style={{fontSize:'10px',color:rFg,margin:0,opacity:0.7}}>current weather</p>
          </div>
        )}
      </div>

      <div style={{display:'flex',borderBottom:'1px solid #E4E0D8',marginBottom:'8px'}}>
        {[{id:'overview',l:'Overview'},{id:'weather',l:`Weather${wx?'✓':loading?'…':''}`},{id:'treatment',l:'Treatment'}].map(tb=>(
          <button key={tb.id} onClick={()=>{ setTab(tb.id); if(tb.id==='weather') loadWx() }} style={{flex:1,padding:'4px 3px',fontSize:'11px',fontWeight:700,background:'none',border:'none',cursor:'pointer',borderBottom:tab===tb.id?'2px solid #1E4D2B':'2px solid transparent',color:tab===tb.id?'#1E4D2B':'#9CA3AF'}}>
            {tb.l}
          </button>
        ))}
      </div>

      {tab==='overview' && (
        <div style={{fontSize:'12px'}}>
          <p style={{margin:'0 0 5px'}}><span style={{color:'#6B7280',fontWeight:600}}>Pathogen: </span>{info.pathogen||'—'}</p>
          <p style={{margin:'0 0 5px'}}><span style={{color:'#6B7280',fontWeight:600}}>Spread rate: </span>{info.spread||'—'}</p>
          <p style={{margin:'0 0 5px'}}><span style={{color:'#6B7280',fontWeight:600}}>Favourable: </span>{info.favTemp}, humidity {info.favHum}</p>
          <p style={{margin:0,background:'#F5F3EE',borderRadius:'6px',padding:'6px 8px'}}><span style={{color:'#6B7280',fontWeight:600}}>Prevention: </span>{info.prevention}</p>
        </div>
      )}

      {tab==='weather' && (
        <div>
          {loading && <p style={{color:'#6B7280',margin:0}}>Fetching live weather…</p>}
          {!loading && !wx && <p style={{color:'#6B7280',margin:0}}>Unavailable. <button onClick={loadWx} style={{color:'#1E4D2B',fontWeight:700,background:'none',border:'none',cursor:'pointer',padding:0,fontSize:'12px'}}>Retry →</button></p>}
          {wx && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px',marginBottom:'7px'}}>
                {[
                  {l:'Temperature',v:`${Math.round(t)}°C (feels ${Math.round(wx.apparent_temperature)}°C)`},
                  {l:'Humidity',   v:`${h}%`},
                  {l:'Wind',       v:`${Math.round(wx.wind_speed_10m)} km/h`},
                  {l:'Condition',  v:WX_CODES[wx.weather_code]||'—'},
                  {l:'Rain',       v:`${wx.precipitation} mm`},
                ].map(d=>(
                  <div key={d.l} style={{background:'#EFF6FF',borderRadius:'7px',padding:'5px 8px',gridColumn:d.l==='Condition'?'span 2':''}}>
                    <p style={{fontSize:'10px',color:'#6B7280',margin:'0 0 1px'}}>{d.l}</p>
                    <p style={{fontWeight:700,color:'#1E3A8A',margin:0,fontSize:'12px'}}>{d.v}</p>
                  </div>
                ))}
              </div>
              {riskLevel && (
                <div style={{background:rBg,borderRadius:'7px',padding:'6px 8px',fontSize:'11px',fontWeight:600,color:rFg}}>
                  {rLabel} — current conditions {riskLevel==='high'?'strongly favour':'partially favour'} this disease spreading
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab==='treatment' && (
        <div style={{fontSize:'12px'}}>
          <div style={{background:'#DCFCE7',borderRadius:'7px',padding:'7px 9px',marginBottom:'6px'}}>
            <p style={{color:'#166534',fontWeight:700,margin:'0 0 3px',fontSize:'11px'}}>RECOMMENDED PRODUCTS</p>
            <p style={{color:'#166534',margin:0}}>{info.treatment||'Consult local KVK'}</p>
          </div>
          <div style={{background:'#FEF3C7',borderRadius:'7px',padding:'7px 9px'}}>
            <p style={{color:'#92400E',fontWeight:700,margin:'0 0 3px',fontSize:'11px'}}>PREVENTION</p>
            <p style={{color:'#92400E',margin:0}}>{info.prevention||'—'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── State info panel ──────────────────────────────────────────────────────────
function StatePanel({ stateName, alerts, onClose, lang }) {
  const stateAlerts = alerts.filter(a => a.state===stateName || stateName.includes(a.state) || a.state.includes(stateName))
  const facts = STATE_FACTS[stateName]
  const [wxData, setWxData] = useState({})
  const stateCenter = { 'Rajasthan':[27.0,74.2],'Uttar Pradesh':[27.1,80.9],'Madhya Pradesh':[23.5,77.6],'Maharashtra':[19.7,75.7],'West Bengal':[23.8,87.8],'Bihar':[25.6,85.1],'Haryana':[29.1,76.1],'Punjab':[31.1,75.3],'Gujarat':[22.3,71.2],'Karnataka':[15.3,75.7],'Andhra Pradesh':[15.9,79.7],'Telangana':[17.1,79.0],'Tamil Nadu':[11.1,78.7],'Kerala':[10.9,76.3],'Odisha':[20.9,84.5],'Chhattisgarh':[21.3,81.9],'Jharkhand':[23.6,85.3] }
  const center = stateCenter[stateName]

  useEffect(() => {
    if (!center) return
    fetchWeather(center[0], center[1]).then(w => setWxData(w||{})).catch(()=>{})
  }, [stateName])

  const totalFarmers = stateAlerts.reduce((s,a)=>s+a.count,0)
  const worstSev = stateAlerts.some(a=>a.severity==='severe')?'severe':stateAlerts.some(a=>a.severity==='moderate')?'moderate':'mild'

  return (
    <div className="card flex flex-col gap-3" style={{padding:'16px'}}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 flex-shrink-0" style={{color:'var(--green)'}}/>
          <h3 className="font-display text-lg font-bold" style={{color:'var(--dark)'}}>{stateName}</h3>
        </div>
        <button onClick={onClose} className="btn-outline btn-sm gap-1">
          <X className="w-3 h-3"/>
        </button>
      </div>

      {/* Quick stats */}
      {stateAlerts.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              {val:stateAlerts.length, label:'Outbreaks'},
              {val:totalFarmers, label:'Affected'},
              {val:worstSev, label:'Worst severity'},
            ].map(s=>(
              <div key={s.label} className="text-center p-2 rounded-xl" style={{background:'var(--bg)'}}>
                <p className="font-display font-extrabold text-base" style={{color:'var(--green)'}}>{s.val}</p>
                <p className="font-body text-[10px]" style={{color:'var(--muted)'}}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Live weather for state */}
          {wxData.temperature_2m && (
            <div className="p-3 rounded-xl" style={{background:'#EFF6FF', border:'1px solid #BFDBFE'}}>
              <p className="font-body text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'#1E40AF'}}>
                🌤 Live State Weather
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  {icon:'🌡',l:'Temp',v:`${Math.round(wxData.temperature_2m)}°C`},
                  {icon:'💧',l:'Humidity',v:`${wxData.relative_humidity_2m}%`},
                  {icon:'💨',l:'Wind',v:`${Math.round(wxData.wind_speed_10m)} km/h`},
                  {icon:'🌧',l:'Rain',v:`${wxData.precipitation} mm`},
                ].map(d=>(
                  <div key={d.l} className="flex items-center gap-1.5 p-1.5 rounded-lg" style={{background:'white'}}>
                    <span className="text-sm">{d.icon}</span>
                    <div>
                      <p className="font-body text-[9px]" style={{color:'var(--muted)'}}>{d.l}</p>
                      <p className="font-body text-xs font-bold" style={{color:'#1E40AF'}}>{d.v}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active outbreaks */}
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'var(--muted)'}}>
              Active Outbreaks
            </p>
            <div className="space-y-2">
              {stateAlerts.map((a,i)=>(
                <div key={i} className="p-3 rounded-xl" style={{background:'var(--bg)'}}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-display text-sm font-bold truncate" style={{color:'var(--dark)'}}>{a.disease}</p>
                    <span className={SEV[a.severity]?.badge+' text-[10px] flex-shrink-0'}>{SEV[a.severity]?.label}</span>
                  </div>
                  <p className="font-body text-xs" style={{color:'var(--muted)'}}>📍 {a.district} · {a.count} farmers</p>
                  <p className="font-body text-[10px] mt-1" style={{color:'var(--muted)'}}>
                    {DISEASE_INFO[a.disease]?.pathogen || ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-display text-sm font-bold mb-1" style={{color:'var(--dark)'}}>No active outbreaks</p>
          <p className="font-body text-xs" style={{color:'var(--muted)'}}>No disease reports from {stateName}</p>
        </div>
      )}

      {/* State agri facts */}
      {facts && (
        <div className="p-3 rounded-xl" style={{background:'#F0FDF4', border:'1px solid #BBF7D0'}}>
          <p className="font-body text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'var(--green)'}}>
            State Agriculture Profile
          </p>
          <div className="space-y-1">
            <p className="font-body text-xs"><span className="font-semibold" style={{color:'var(--dark)'}}>Major crops: </span><span style={{color:'var(--muted)'}}>{facts.majorCrops}</span></p>
            <p className="font-body text-xs"><span className="font-semibold" style={{color:'var(--dark)'}}>Climate: </span><span style={{color:'var(--muted)'}}>{facts.climate}</span></p>
            <p className="font-body text-xs"><span className="font-semibold" style={{color:'var(--dark)'}}>Annual rainfall: </span><span style={{color:'var(--muted)'}}>{facts.avgRainfall}</span></p>
          </div>
          <div className="mt-2 p-2 rounded-lg" style={{background:'white'}}>
            <p className="font-body text-[11px]" style={{color:'var(--green-mid)'}}>💡 {facts.tip}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AlertMapPage({ lang }) {
  const [data, setData]           = useState(null)
  const [statesGeo, setStatesGeo] = useState(null)
  const [filter, setFilter]       = useState('all')
  const [flyTarget, setFlyTarget] = useState(null)
  const [selectedState, setSelectedState] = useState(null)
  const [stateFilter, setStateFilter] = useState(null)
  const geoJsonRef = useRef()

  // Fetch real India state boundaries from public CDN — runs in browser, not server
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
          // Normalize property name to "name"
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
    'Jammu & Kashmir':{lat:34.0,lng:76.6},'Sikkim':{lat:27.5,lng:88.5},'Assam':{lat:26.0,lng:92.5},
    'Arunachal Pradesh':{lat:28.0,lng:94.5},'Nagaland':{lat:26.0,lng:94.5},'Manipur':{lat:24.8,lng:93.9},
    'Mizoram':{lat:23.2,lng:92.7},'Tripura':{lat:23.7,lng:91.7},'Meghalaya':{lat:25.5,lng:91.4},
    'Goa':{lat:15.3,lng:74.1},
  }



  const getStateStyle = useCallback((feature) => {
    const name = feature.properties.name
    const isSelected = selectedState === name
    const isDimmed = stateFilter && stateFilter !== name

    return {
      fillColor: isSelected ? '#52B788' : 'transparent',
      fillOpacity: isSelected ? 0.25 : 0,
      color: isSelected ? '#52B788' : isDimmed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
      weight: isSelected ? 2 : 0.6,
    }
  }, [selectedState, stateFilter])

  const onEachState = useCallback((feature, layer) => {
    const name = feature.properties.name
    layer.on({
      click: () => {
        setSelectedState(s => s === name ? null : name)
        const c = STATE_CENTERS[name]
        if (c) setFlyTarget({ lat:c.lat, lng:c.lng, zoom:6 })
      },
      mouseover: (e) => {
        // Direct style mutation — no React re-render, no lag
        e.target.setStyle({ fillOpacity: 0.9, weight: 2, color: '#1E4D2B' })
        e.target.bringToFront()
      },
      mouseout: (e) => {
        e.target.setStyle(getStateStyle(feature))
      },
    })
    layer.bindTooltip(name, { permanent: false, sticky: true, className: 'state-tooltip' })
  }, [getStateStyle])

  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Activity className="w-8 h-8 dot-pulse mr-3" style={{color:'var(--green)'}}/>
      <p className="font-body text-sm" style={{color:'var(--muted)'}}>Loading alerts…</p>
    </div>
  )

  const allAlerts = data.alerts
  const filtered = allAlerts.filter(a => {
    const sevOk   = filter==='all' || a.severity===filter
    const stateOk = !stateFilter || a.state===stateFilter || stateFilter.includes(a.state) || a.state.includes(stateFilter)
    return sevOk && stateOk
  })
  const totalAffected = allAlerts.reduce((s,a)=>s+a.count,0)
  const affStates = [...new Set(allAlerts.map(a=>a.state))].length

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3
                        text-xs font-bold font-body uppercase tracking-wider"
             style={{background:'#FEE2E2',color:'#991B1B'}}>
          <span className="w-2 h-2 rounded-full bg-red-500 dot-pulse"/>
          Live Disease Alerts
        </div>
        <h1 className="font-display text-4xl font-extrabold mb-1" style={{color:'var(--dark)'}}>Disease Alert Map</h1>
        <p className="font-body text-sm" style={{color:'var(--muted)'}}>
          Click a state for agriculture profile · Click a marker for live weather &amp; treatment guidance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          {val:data.total_scans, label:'Total Scans',      sub:'prototype session'},
          {val:affStates,         label:'States Affected',  sub:'active outbreaks'},
          {val:totalAffected,     label:'Farmers Affected', sub:'aggregated data'},
        ].map(s=>(
          <div key={s.label} className="card p-4 text-center">
            <p className="font-display text-2xl font-extrabold" style={{color:'var(--green)'}}>{s.val}</p>
            <p className="font-body text-sm font-semibold" style={{color:'var(--dark)'}}>{s.label}</p>
            <p className="font-body text-xs" style={{color:'var(--muted)'}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">

        {/* Severity pills */}
        <div className="flex items-center gap-1.5">
          <span className="font-body text-xs font-bold uppercase tracking-wider mr-1" style={{color:'var(--muted)'}}>Severity</span>
          {['all','mild','moderate','severe'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
                    className={`btn-sm font-semibold ${filter===f?'btn-primary':'btn-outline'}`}>
              {f==='all'?'All':SEV[f]?.label}
              {f!=='all' && <span className="ml-1 opacity-50 text-[10px]">({allAlerts.filter(a=>a.severity===f).length})</span>}
            </button>
          ))}
        </div>

        {/* State dropdown */}
        <div className="flex items-center gap-2">
          <span className="font-body text-xs font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>State</span>
          <div className="relative">
            <select
              value={stateFilter || ''}
              onChange={e => {
                const val = e.target.value
                setStateFilter(val || null)
                setSelectedState(val || null)
                if (val) { const c=STATE_CENTERS[val]; if(c) setFlyTarget({lat:c.lat,lng:c.lng,zoom:6}) }
                else setFlyTarget({lat:22.5,lng:80.5,zoom:5})
              }}
              className="input text-sm py-2 pl-3 pr-8 appearance-none cursor-pointer font-semibold"
              style={{height:'36px', minWidth:'160px', background:'var(--surface)', color:'var(--dark)', borderColor: stateFilter ? 'var(--green)' : 'var(--border)'}}>
              <option value="">All India</option>
              <optgroup label="States with outbreaks">
                {[...new Set(allAlerts.map(a=>a.state))].sort().map(s=>(
                  <option key={s} value={s}>{s} ({allAlerts.filter(a=>a.state===s).length} outbreaks)</option>
                ))}
              </optgroup>
              <optgroup label="All states">
                {Object.keys(STATE_CENTERS).filter(s => !allAlerts.some(a=>a.state===s)).sort().map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" style={{color:'var(--muted)'}}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        {/* Clear */}
        {(stateFilter || filter!=='all') && (
          <button onClick={()=>{ setFilter('all'); setStateFilter(null); setSelectedState(null); setFlyTarget({lat:22.5,lng:80.5,zoom:5}) }}
                  className="btn-sm btn-outline gap-1" style={{color:'var(--danger)',borderColor:'var(--danger)'}}>
            <X className="w-3 h-3"/> Clear filters
          </button>
        )}

      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Map */}
        <div className="rounded-2xl overflow-hidden" style={{height:'580px',border:'1px solid var(--border)',background:'#0d1117'}}>
          <MapContainer
            center={[22.5, 80.5]} zoom={5}
            minZoom={4} maxZoom={10}
            style={{height:'100%',width:'100%'}}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
            />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              pane="shadowPane"
            />

            {/* State boundaries — clickable (real shapes loaded from CDN) */}
            {statesGeo && <GeoJSON
              key="india-states"
              data={statesGeo}
              style={getStateStyle}
              onEachFeature={onEachState}
            />}

            <FlyTo target={flyTarget}/>

            {/* Disease markers */}
            {filtered.map((alert,i)=>(
              <CircleMarker key={i}
                center={[alert.lat, alert.lng]}
                radius={SEV[alert.severity]?.radius||12}
                pathOptions={{fillColor:SEV[alert.severity]?.hex,fillOpacity:0.92,color:'#fff',weight:2.5}}>
                <Popup minWidth={272} maxWidth={285}>
                  <OutbreakPopup alert={alert}/>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3" style={{maxHeight:'580px', overflowY:'auto'}}>
          {selectedState ? (
            <StatePanel
              stateName={selectedState}
              alerts={allAlerts}
              onClose={()=>{ setSelectedState(null); setFlyTarget({lat:22.5,lng:80.5,zoom:5}) }}
              lang={lang}
            />
          ) : (
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-wider mb-3" style={{color:'var(--muted)'}}>
                {filtered.length} outbreaks · click to zoom
              </p>
              <div className="space-y-2">
                {filtered.sort((a,b)=>b.count-a.count).map((alert,i)=>(
                  <div key={i}
                       onClick={()=>{ setSelectedState(alert.state); const c=STATE_CENTERS[alert.state]; if(c) setFlyTarget({lat:c.lat,lng:c.lng,zoom:6}) }}
                       className="card p-3.5 flex items-start gap-3 cursor-pointer transition-all"
                       onMouseEnter={e=>e.currentTarget.style.borderColor='#74C69D'}
                       onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{background:SEV[alert.severity]?.hex}}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-display text-sm font-bold truncate" style={{color:'var(--dark)'}}>{alert.disease}</p>
                        <span className={SEV[alert.severity]?.badge+' text-[11px] flex-shrink-0'}>{SEV[alert.severity]?.label}</span>
                      </div>
                      <p className="font-body text-xs" style={{color:'var(--muted)'}}>{alert.district}, {alert.state}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-body text-xs font-semibold" style={{color:'var(--dark)'}}>{alert.count} farmers</span>
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{background:'var(--bg)'}}>
                          <div className="h-full rounded-full" style={{width:`${Math.min(100,(alert.count/89)*100)}%`,background:SEV[alert.severity]?.hex}}/>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="card p-3" style={{background:'var(--bg)'}}>
            <p className="font-body text-[10px] font-bold uppercase tracking-wider mb-2" style={{color:'var(--muted)'}}>Map Legend</p>
            <div className="space-y-1.5">
              {[{c:'#FCA5A5',l:'State with severe outbreak'},{c:'#FED7AA',l:'State with moderate outbreak'},{c:'#FEF08A',l:'State with mild outbreak'},{c:'#1E4D2B',l:'Selected state'}].map(d=>(
                <div key={d.l} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm border border-black/10 flex-shrink-0" style={{background:d.c}}/>
                  <span className="font-body text-xs" style={{color:'var(--dark)'}}>{d.l}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-1 mt-1" style={{borderTop:'1px solid var(--border)'}}>
                <div className="w-3 h-3 rounded-full border-2 border-white flex-shrink-0" style={{background:'#EF4444'}}/>
                <span className="font-body text-xs" style={{color:'var(--dark)'}}>Outbreak marker (size = severity)</span>
              </div>
            </div>
          </div>

          <div className="card p-3" style={{background:'#FEF3C7',border:'1px solid #FDE68A'}}>
            <p className="font-body text-xs" style={{color:'#92400E'}}>
              <strong>Prototype:</strong> Outbreak data is seeded. Weather is live from Open-Meteo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

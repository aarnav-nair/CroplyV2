import { useState, useEffect } from 'react'
import { getRecommendations } from '../services/api.js'
import KisanBot from './KisanBot.jsx'
import DiseaseProgressionTracker from './DiseaseProgressionTracker.jsx'
import {
  ArrowLeft, ShoppingCart, Info, MessageCircle,
  ChevronDown, ChevronUp, Star, Shield, Leaf,
  Zap, Wind, Layers, AlertTriangle, CheckCircle2,
  Package, Share2, Calculator
} from 'lucide-react'

// ── Dosage Calculator helpers ─────────────────────────────────────────────────
// Parses "5ml per litre" / "2.5g per litre" from product.dosage string
function parseDosage(dosageStr) {
  if (!dosageStr) return null
  const m = dosageStr.match(/([\d.]+)\s*(ml|g|kg|litre|l)\s*per\s*(litre|liter|l\b)/i)
  if (!m) return null
  return { amount: parseFloat(m[1]), unit: m[2].toLowerCase() }
}

// Parses package size from product.unit string e.g. "1 litre bottle" → 1000 (in ml)
// or "500g pack" → 500 (in g)
function parsePackageSize(unitStr) {
  if (!unitStr) return null
  const m = unitStr.match(/([\d.]+)\s*(ml|g|kg|litre|liter|l)\b/i)
  if (!m) return null
  let val = parseFloat(m[1])
  const u = m[2].toLowerCase()
  if (u === 'litre' || u === 'liter' || u === 'l') val = val * 1000 // to ml
  if (u === 'kg') val = val * 1000 // to g
  return val
}

// 1 acre ≈ 200 litres of spray solution (standard for field crops in India)
const LITRES_PER_ACRE = 200

function calcDosage(product, acres) {
  const parsed = parseDosage(product.dosage)
  const pkgSize = parsePackageSize(product.unit)
  if (!parsed || !pkgSize || acres <= 0) return null

  const totalWater = acres * LITRES_PER_ACRE            // litres of water
  const productNeeded = totalWater * parsed.amount       // ml or g needed
  const packs = Math.ceil(productNeeded / pkgSize)
  const totalCost = packs * product.price_per_unit

  // Display amount
  let displayQty, displayUnit
  if (parsed.unit === 'ml' || parsed.unit === 'l') {
    if (productNeeded >= 1000) {
      displayQty = (productNeeded / 1000).toFixed(2).replace(/\.?0+$/, '')
      displayUnit = 'litres'
    } else {
      displayQty = productNeeded.toFixed(0)
      displayUnit = 'ml'
    }
  } else {
    if (productNeeded >= 1000) {
      displayQty = (productNeeded / 1000).toFixed(2).replace(/\.?0+$/, '')
      displayUnit = 'kg'
    } else {
      displayQty = productNeeded.toFixed(0)
      displayUnit = 'g'
    }
  }

  return { displayQty, displayUnit, packs, totalCost }
}

function DosageCalculator({ product, lang }) {
  const hi = lang === 'hi'
  const [acres, setAcres] = useState('')
  const result = acres ? calcDosage(product, parseFloat(acres)) : null
  const canCalc = !!parseDosage(product.dosage)

  if (!canCalc) return (
    <div className="p-2.5 rounded-lg mb-3" style={{background:'var(--bg)'}}>
      <p className="font-body text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{color:'var(--muted)'}}>
        {hi ? 'खुराक' : 'Dosage'}
      </p>
      <p className="font-body text-xs font-medium" style={{color:'var(--dark)'}}>{product.dosage}</p>
    </div>
  )

  return (
    <div className="rounded-2xl mb-4 overflow-hidden"
         style={{border:'2px solid var(--green-lt)'}}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3"
           style={{background:'var(--green)'}}>
        <Calculator className="w-5 h-5 text-white flex-shrink-0"/>
        <span className="font-body text-sm font-bold text-white">
          {hi ? 'खुराक कैलकुलेटर' : 'Dosage Calculator'}
        </span>
      </div>

      <div className="p-4" style={{background:'var(--bg)'}}>
        {/* Dosage reference */}
        <p className="font-body text-sm mb-3" style={{color:'var(--muted)'}}>
          {hi ? 'दर: ' : 'Rate: '}<strong style={{color:'var(--dark)'}}>{product.dosage}</strong>
        </p>

        {/* Acres input */}
        <div className="flex items-center gap-3 mb-3">
          <input
            type="number"
            min="0.1" step="0.1"
            value={acres}
            onChange={e => setAcres(e.target.value)}
            placeholder={hi ? 'एकड़ दर्ज करें' : 'Enter field size'}
            className="input text-base flex-1 font-semibold"
            style={{height:'44px', padding:'8px 14px', fontSize:'16px'}}
          />
          <span className="font-body text-sm font-bold flex-shrink-0"
                style={{color:'var(--dark)'}}>
            {hi ? 'एकड़' : 'acres'}
          </span>
        </div>

        {/* Result */}
        {result && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: hi ? 'उत्पाद चाहिए' : 'Product needed', val: `${result.displayQty} ${result.displayUnit}`, color: 'var(--green)' },
              { label: hi ? 'पैक / बोतल' : 'Packs / bottles', val: result.packs, color: 'var(--dark)' },
              { label: hi ? 'कुल लागत' : 'Total cost', val: `₹${result.totalCost}`, color: '#0369a1' },
            ].map(d => (
              <div key={d.label} className="p-3 rounded-xl text-center"
                   style={{background:'var(--surface)', border:'1.5px solid var(--border)'}}>
                <p className="font-display text-xl font-extrabold leading-none mb-1" style={{color: d.color}}>{d.val}</p>
                <p className="font-body text-xs leading-tight" style={{color:'var(--muted)'}}>{d.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const SEV = {
  mild:     { label:'Mild',     label_hi:'हल्का',  cls:'sev-mild',     icon:CheckCircle2,  desc:'Early stage — act quickly to prevent spread.' },
  moderate: { label:'Moderate', label_hi:'मध्यम', cls:'sev-moderate', icon:AlertTriangle, desc:'Active infection — treatment required this week.' },
  severe:   { label:'Severe',   label_hi:'गंभीर', cls:'sev-severe',   icon:Zap,           desc:'Critical — immediate treatment is essential.' },
}



function ProductCard({ product, onAddToCart, lang }) {
  const [expanded, setExpanded] = useState(false)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="card-hover" style={{padding:'20px'}}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-1.5">
            {product.organic_certified && (
              <span className="text-[10px] font-body font-bold uppercase tracking-wider text-green-700">Organic Certified</span>
            )}
          </div>
          <h4 className="font-display text-base font-bold leading-snug" style={{color:'var(--dark)'}}>
            {product.name}
          </h4>
          <p className="font-body text-xs mt-0.5" style={{color:'var(--muted)'}}>
            {product.manufacturer}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-display text-2xl font-extrabold" style={{color:'var(--green)'}}>₹{product.price_per_unit}</p>
          <p className="font-body text-xs" style={{color:'var(--muted)'}}>/{product.unit}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <Star className="w-3 h-3 fill-current" style={{color:'var(--gold)'}}/>
            <span className="font-body text-xs font-semibold" style={{color:'var(--dark)'}}>{product.rating}</span>
          </div>
        </div>
      </div>

      {/* Why recommended */}
      <div className="p-3 rounded-xl mb-3" style={{background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
        <p className="font-body text-xs font-bold mb-1.5 uppercase tracking-wide" style={{color:'var(--green-mid)'}}>
          {lang==='hi'?'यह क्यों काम करेगा':'Why this works'}
        </p>
        <p className="font-body text-sm leading-relaxed" style={{color:'#166534'}}>
          {product.why_recommended}
        </p>
      </div>

      {/* Dosage Calculator */}
      <DosageCalculator product={product} lang={lang} />

      {/* Pre-harvest interval */}
      <div className="p-2.5 rounded-lg mb-3" style={{background:'var(--bg)'}}>
        <p className="font-body text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{color:'var(--muted)'}}>
          {lang==='hi' ? 'पूर्व-कटाई अंतराल' : 'Pre-harvest interval'}
        </p>
        <p className="font-body text-xs font-medium" style={{color:'var(--dark)'}}>{product.pre_harvest_interval}</p>
      </div>

      {/* Expand */}
      <button onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs font-body mb-3 transition-colors"
              style={{color:'var(--muted)'}}>
        {expanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
        {expanded ? (lang==='hi'?'कम दिखाएं':'Show less') : (lang==='hi'?'और विवरण':'More details')}
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-body">
          {[
            {label:'Active Ingredient', val:product.active_ingredient},
            {label:'Type', val:product.type},
            {label:'Classification', val:product.classification},
            {label:'Stock', val:`${product.stock} units`},
          ].map(d => (
            <div key={d.label} className="p-2.5 rounded-lg" style={{background:'var(--bg)'}}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{color:'var(--muted)'}}>{d.label}</p>
              <p className="font-medium" style={{color:'var(--dark)'}}>{d.val}</p>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleAdd}
              className={`btn-md w-full font-bold transition-all ${added ? 'btn-outline' : 'btn-primary'}`}>
        {added
          ? <><CheckCircle2 className="w-4 h-4 text-green-600"/>Added to cart</>
          : <><ShoppingCart className="w-4 h-4"/>{lang==='hi'?'कार्ट में डालें':'Add to Cart'}</>}
      </button>
    </div>
  )
}

export default function ResultsPage({ result, imagePreview, onAddToCart, onNavigate, lang }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('treatment')

  const sev = SEV[result.severity] || SEV.mild
  const SevIcon = sev.icon

  useEffect(() => {
    getRecommendations(result).then(p => {
      setProducts(p)
      setLoading(false)
    })
  }, [result])

  return (
    <div className="container py-10">
      {/* Back */}
      <button onClick={() => onNavigate('scan')}
              className="flex items-center gap-2 text-sm font-body mb-6 transition-colors"
              style={{color:'var(--muted)'}}>
        <ArrowLeft className="w-4 h-4"/>
        {lang==='hi'?'नया स्कैन करें':'New Scan'}
      </button>

      {/* Top banner */}
      <div className="card mb-6 p-5" style={{borderLeft:'4px solid var(--green)'}}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" style={{color:'var(--green)'}}/>
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-wider" style={{color:'var(--green)'}}>
                {lang==='hi'?'AI जांच पूरी हुई':'Analysis Complete'}
              </p>
              <p className="font-body text-xs" style={{color:'var(--muted)'}}>
                Scan ID #{result.scan_id} · {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button className="btn-outline btn-sm gap-2">
            <Share2 className="w-3.5 h-3.5"/>
            {lang==='hi'?'शेयर करें':'Share Report'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-6">

        {/* ── Left: Disease card ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Leaf + Grad-CAM */}
          <div className="card p-0 overflow-hidden">
            <div className="relative aspect-video bg-gray-50">
              {imagePreview && (
                <img src={imagePreview} alt="Scanned leaf"
                     className="w-full h-full object-cover"/>
              )}
              {result.gradcam_base64 && (
                <img src={`data:image/svg+xml;base64,${result.gradcam_base64}`}
                     alt="Grad-CAM"
                     className="absolute inset-0 w-full h-full object-cover opacity-55 mix-blend-multiply"/>
              )}
              <div className="absolute inset-0"
                   style={{background:'linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.5) 100%)'}}/>
              <div className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-lg"
                   style={{background:'rgba(0,0,0,0.55)',backdropFilter:'blur(4px)'}}>
                <span className="text-white text-[10px] font-body font-bold uppercase tracking-wider">Analysis Overlay</span>
              </div>
            </div>

            {/* Confidence */}
            <div className="p-4 flex flex-col justify-center border-t" style={{borderColor:'var(--border)'}}>
              <p className="font-body text-xs font-bold uppercase tracking-wider mb-2" style={{color:'var(--muted)'}}>
                {lang==='hi'?'AI विश्वास स्तर':'AI Confidence'}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{background:'var(--bg)'}}>
                  <div className="h-full rounded-full" style={{width:`${result.confidence}%`, background:'var(--green-lt)'}}/>
                </div>
                <span className="font-body text-sm font-bold" style={{color:'var(--dark)'}}>{Math.round(result.confidence)}%</span>
              </div>
            </div>
          </div>

          {/* Disease Progression Tracker */}
          <DiseaseProgressionTracker result={result} lang={lang} />

          {/* Disease info */}
          <div className="card space-y-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={sev.cls}>
                  <SevIcon className="w-3 h-3"/>
                  {lang==='hi' ? sev.label_hi : sev.label} Severity
                </span>
                <span className="badge-neutral">{result.crop}</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold" style={{color:'var(--dark)'}}>
                {lang==='hi' ? result.disease_name_hi : result.disease_name}
              </h2>
              {result.pathogen && (
                <p className="font-body text-xs mt-1 italic" style={{color:'var(--muted)'}}>{result.pathogen}</p>
              )}
            </div>

            <div className="p-3 rounded-xl text-sm font-body" style={{background:'#FEF3C7',border:'1px solid #FDE68A'}}>
              <AlertTriangle className="w-4 h-4 inline mr-1.5 text-amber-600"/>
              <span className="font-semibold text-amber-800">{sev.desc}</span>
            </div>

            <hr style={{borderColor:'var(--border)'}}/>

            <p className="font-body text-sm leading-relaxed" style={{color:'var(--ink-soft)','--ink-soft':'#374151'}}>
              {lang==='hi' ? result.description_hi : result.description}
            </p>

            <div className="space-y-2.5">
              {[
                { icon: Info,   label: lang==='hi'?'कारण':'Cause',        val: result.causes },
                { icon: Wind,   label: lang==='hi'?'फैलाव की गति':'Spread Rate', val: result.spread_rate },
                { icon: Layers, label: lang==='hi'?'प्रभावित भाग':'Affects',  val: result.affected_parts?.join(', ') },
              ].map(d => (
                <div key={d.label} className="flex items-start gap-3 text-sm font-body">
                  <d.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{color:'var(--green-mid)'}}/>
                  <div>
                    <span className="font-semibold" style={{color:'var(--dark)'}}>{d.label}: </span>
                    <span style={{color:'var(--muted)'}}>{d.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Tabs ────────────────────────────────────────── */}
        <div>
          {/* Tab bar */}
          <div className="flex border-b mb-5" style={{borderColor:'var(--border)'}}>
            {[
              { id:'treatment', label:lang==='hi'?'अनुशंसित उपचार':'Recommended Treatments', icon:Package },
              { id:'bot',       label:lang==='hi'?'क्रॉपली बॉट':'Ask Croply Bot',               icon:MessageCircle },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-body font-semibold -mb-px transition-all ${tab===t.id?'tab-active':'tab-inactive'}`}>
                <t.icon className="w-4 h-4"/>
                {t.label}
              </button>
            ))}
          </div>

          {/* Treatments */}
          {tab==='treatment' && (
            <div>
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(n => (
                    <div key={n} className="card space-y-3">
                      <div className="skeleton h-4 w-2/3"/>
                      <div className="skeleton h-3 w-1/2"/>
                      <div className="skeleton h-16"/>
                      <div className="skeleton h-10"/>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-body text-xs" style={{color:'var(--muted)'}}>
                      {products.length} treatments matched · organic shown first
                    </p>
                    <span className="badge-green text-xs">
                      <CheckCircle2 className="w-3 h-3"/>
                      Disease-specific
                    </span>
                  </div>
                  {products.map(p => (
                    <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} lang={lang}/>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bot */}
          {tab==='bot' && <KisanBot result={result} lang={lang}/>}
        </div>
      </div>
    </div>
  )
}
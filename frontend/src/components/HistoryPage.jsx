import { useState } from 'react'
import { Clock, Leaf, ShoppingBag, ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, Scan } from 'lucide-react'

const SEV = {
  mild:     { cls:'sev-mild',     icon:CheckCircle2,  bar:'var(--green-lt)' },
  moderate: { cls:'sev-moderate', icon:AlertTriangle, bar:'#F97316' },
  severe:   { cls:'sev-severe',   icon:TrendingUp,    bar:'#EF4444' },
}

export default function HistoryPage({ onNavigate, lang, scanHistory = [], orders = [], onClearHistory }) {

  if (scanHistory.length === 0) {
    return (
      <div className="container py-10 max-w-2xl">
        <div className="flex items-start gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{background:'var(--surface)', border:'1px solid var(--border)'}}>
            <Clock className="w-5 h-5" style={{color:'var(--green)'}}/>
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold" style={{color:'var(--dark)'}}>
              {lang==='hi'?'स्कैन इतिहास':'Scan History'}
            </h1>
            <p className="font-body text-sm" style={{color:'var(--muted)'}}>
              {lang==='hi'?'आपके पिछले सभी फसल निदान':'All your past crop diagnoses and treatments'}
            </p>
          </div>
        </div>

        {/* Empty state */}
        <div className="card p-12 text-center" style={{border:'2px dashed var(--border)'}}>
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
               style={{background:'var(--bg)'}}>
            <Scan className="w-8 h-8" style={{color:'var(--muted)'}}/>
          </div>
          <h2 className="font-display text-xl font-bold mb-2" style={{color:'var(--dark)'}}>
            {lang==='hi'?'अभी तक कोई स्कैन नहीं':'No scans yet'}
          </h2>
          <p className="font-body text-sm mb-6 max-w-xs mx-auto" style={{color:'var(--muted)'}}>
            {lang==='hi'
              ? 'अपनी पहली फसल स्कैन करें। जांच के बाद आपका इतिहास यहाँ दिखेगा।'
              : 'Scan your first crop to get started. Your diagnosis history will appear here after each scan.'}
          </p>
          <button onClick={() => onNavigate('scan')}
                  className="btn-primary btn-lg inline-flex gap-2">
            {lang==='hi'?'पहली फसल स्कैन करें':'Scan Your First Crop'}
            <ArrowRight className="w-4 h-4"/>
          </button>
        </div>

      </div>
    )
  }

  // Has scan history
  const totalProducts = scanHistory.reduce((s,h) => s + (h.products||[]).length, 0)
  const resolved = scanHistory.filter(h => h.resolved).length

  return (
    <div className="container py-10 max-w-2xl">
      <div className="flex items-start gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{background:'var(--surface)', border:'1px solid var(--border)'}}>
          <Clock className="w-5 h-5" style={{color:'var(--green)'}}/>
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{color:'var(--dark)'}}>
            {lang==='hi'?'स्कैन इतिहास':'Scan History'}
          </h1>
          <p className="font-body text-sm" style={{color:'var(--muted)'}}>
            {scanHistory.length} {lang==='hi'?'स्कैन':'scans'} · {resolved} {lang==='hi'?'ठीक हुई':'resolved'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { val:scanHistory.length, label:lang==='hi'?'कुल स्कैन':'Total Scans', icon:'🔍', color:'var(--surface)' },
          { val:resolved,            label:lang==='hi'?'ठीक हुई':'Resolved',      icon:'✅', color:'var(--surface)' },
          { val:totalProducts,       label:lang==='hi'?'उत्पाद खरीदे':'Products Bought', icon:'💊', color:'var(--surface)' },
        ].map(s => (
          <div key={s.label} className="card text-center p-4">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="font-display text-2xl font-extrabold" style={{color:'var(--green)'}}>{s.val}</p>
            <p className="font-body text-xs" style={{color:'var(--muted)'}}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Scan list */}
      <div className="space-y-4">
        {scanHistory.map((scan, i) => {
          const sev = SEV[scan.severity] || SEV.mild
          const SevIcon = sev.icon
          return (
            <div key={scan.id || i} className="card-hover p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-body text-xs font-bold px-2 py-0.5 rounded-md"
                          style={{background:'var(--bg)', color:'var(--muted)'}}>
                      #{scan.id}
                    </span>
                    <span className="font-body text-xs" style={{color:'var(--muted)'}}>{scan.date}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold" style={{color:'var(--dark)'}}>
                    {lang==='hi'
                      ? `${scan.crop_hi||scan.crop} — ${scan.disease_hi||scan.disease}`
                      : `${scan.crop} — ${scan.disease}`}
                  </h3>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={sev.cls + ' flex items-center gap-1'}>
                    <SevIcon className="w-3 h-3"/>{scan.severity}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-body border
                    ${scan.resolved ? 'badge-green' : 'badge-amber'}`}>
                    {scan.resolved
                      ? (lang==='hi'?'✓ ठीक हुई':'✓ Resolved')
                      : (lang==='hi'?'⚠ जारी है':'⚠ Active')}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="font-body text-[10px] font-bold uppercase tracking-wider" style={{color:'var(--muted)'}}>
                    AI Confidence
                  </span>
                  <span className="font-body text-xs font-bold" style={{color:'var(--green)'}}>{scan.confidence}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width:`${scan.confidence}%`}}/>
                </div>
              </div>

              {scan.products?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" style={{color:'var(--muted)'}}/>
                  {scan.products.map(p => (
                    <span key={p} className="font-body text-xs px-2.5 py-1 rounded-full"
                          style={{background:'var(--bg)', border:'1px solid var(--border)', color:'var(--dark)'}}>
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Past Orders */}
      {orders.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-xl font-bold mb-4" style={{color:'var(--dark)'}}>
            {lang==='hi'?'पिछले ऑर्डर':'Past Orders'}
          </h2>
          <div className="space-y-3">
            {orders.map((order, i) => (
              <div key={order.order_id || i} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-body text-xs font-bold px-2 py-0.5 rounded-md inline-block mb-1"
                       style={{background:'var(--bg)',color:'var(--muted)'}}>
                      #{order.order_id}
                    </p>
                    <p className="font-body text-xs" style={{color:'var(--muted)'}}>
                      {order.placed_at ? new Date(order.placed_at).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : 'Recent'}
                    </p>
                  </div>
                  <span className="badge-green">{lang==='hi'?'✓ पुष्टि हुई':'✓ Confirmed'}</span>
                </div>
                <div className="space-y-1 mb-2">
                  {order.items?.map((item, j) => (
                    <div key={j} className="flex justify-between text-sm font-body">
                      <span style={{color:'var(--dark)'}}>{item.name} × {item.quantity}</span>
                      <span className="font-semibold" style={{color:'var(--green)'}}>₹{item.item_total || item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold font-body pt-2"
                     style={{borderTop:'1px solid var(--border)'}}>
                  <span style={{color:'var(--dark)'}}>Total</span>
                  <span className="font-display text-lg" style={{color:'var(--green)'}}>₹{order.total_amount}</span>
                </div>
                <p className="font-body text-xs mt-2" style={{color:'var(--muted)'}}>
                  🚚 {lang==='hi'?'अनुमानित डिलीवरी:':'Est. delivery:'} {order.estimated_delivery || '3-5 business days'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear history */}
      {(scanHistory.length > 0 || orders.length > 0) && onClearHistory && (
        <div className="mt-4 text-center">
          <button onClick={onClearHistory}
                  className="btn-outline btn-sm text-xs"
                  style={{color:'var(--muted)',borderColor:'var(--border)'}}>
            {lang==='hi'?'इतिहास साफ करें':'Clear scan history'}
          </button>
        </div>
      )}

      <div className="mt-8 card p-6 text-center" style={{background:'var(--green)', border:'none'}}>
        <Leaf className="w-8 h-8 mx-auto mb-3" style={{color:'rgba(255,255,255,0.4)'}}/>
        <h3 className="font-display text-lg font-bold text-white mb-2">
          {lang==='hi'?'नई फसल स्कैन करें':'Ready to scan again?'}
        </h3>
        <button onClick={() => onNavigate('scan')} className="btn-gold btn-md font-bold mx-auto mt-2">
          {lang==='hi'?'स्कैन करें':'Scan Now'} <ArrowRight className="w-4 h-4"/>
        </button>
      </div>
    </div>
  )
}

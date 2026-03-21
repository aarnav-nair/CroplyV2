import { ArrowRight, Zap, Shield, MapPin, TrendingUp, CheckCircle, AlertTriangle, Leaf } from 'lucide-react'

const FEATURES = [
  {
    icon: Zap, color:'#FEF3C7', iconColor:'#92400E',
    tag:'Core', title:'Instant AI Diagnosis',
    body:'Upload a leaf photo — the model identifies disease class, severity level, and the responsible pathogen.',
  },
  {
    icon: Shield, color:'#DBEAFE', iconColor:'#1E40AF',
    tag:'Transparency', title:'Grad-CAM Heatmap',
    body:'A visual overlay highlights exactly which region of the leaf the model focused on. No black box.',
  },
  {
    icon: TrendingUp, color:'#DCFCE7', iconColor:'#166534',
    tag:'Marketplace', title:'Smart Treatment Matching',
    body:'Products filtered to the detected disease, ranked by severity suitability. Organic options always listed first.',
  },
  {
    icon: MapPin, color:'#FEE2E2', iconColor:'#991B1B',
    tag:'Community', title:'Disease Alert Map',
    body:'Aggregated scan data shows which diseases are active across Indian states — giving farmers early warning.',
  },
]

export default function HomePage({ onNavigate, lang }) {
  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{background:'var(--hero-bg)'}} className="relative">

        <div className="container relative py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6
                              border border-green-lt/20 bg-green-lt/8">
                <span className="text-green-lt text-xs font-body font-semibold tracking-wider uppercase">
                  {lang==='hi'?'किसानों के लिए AI':'Click. Detect. Act.'}
                </span>
              </div>

              <h1 className="text-5xl md:text-[58px] font-display font-extrabold text-white mb-5 leading-[1.0]">
                {lang==='hi' ? (
                  <>फसल की बीमारी<br/><span style={{color:'var(--gold-lt)'}}>तुरंत पहचानें।</span></>
                ) : (
                  <>Diagnose crop disease<br/><span style={{color:'var(--gold-lt)'}}>before it spreads.</span></>
                )}
              </h1>

              <p style={{color:'rgba(255,255,255,0.5)'}}
                 className="text-[15px] font-body leading-relaxed mb-8 max-w-[420px]">
                {lang==='hi'
                  ? 'पत्ती की फोटो खींचें → AI बीमारी पहचाने → सत्यापित दवा खरीदें।'
                  : 'Photograph an affected leaf — the AI identifies the disease and pathogen, then recommends verified treatments you can order directly.'}
              </p>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => onNavigate('scan')} className="btn-gold btn-lg font-bold">
                  {lang==='hi'?'फसल स्कैन करें':'Scan Your Crop'}
                  <ArrowRight className="w-4 h-4"/>
                </button>
                <button onClick={() => onNavigate('map')} className="btn-ghost btn-lg">
                  {lang==='hi'?'अलर्ट मैप':'Alert Map'}
                </button>
              </div>
            </div>

            {/* Right — result preview card */}
            <div className="relative w-full max-w-[420px] mx-auto lg:ml-auto lg:mr-0">
              <div style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)'}}
                   className="rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-red-400"/>
                  <div className="w-2 h-2 rounded-full bg-amber-400"/>
                  <div className="w-2 h-2 rounded-full bg-green-400"/>
                  <span style={{color:'rgba(255,255,255,0.25)'}} className="text-xs font-body ml-2">croply.ai / results</span>
                </div>

                <div style={{background:'rgba(82,183,136,0.06)',border:'1px solid rgba(82,183,136,0.2)'}}
                     className="rounded-xl p-4 mb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{color:'var(--green-lt)'}} className="text-xs font-body font-semibold uppercase tracking-wider mb-1">
                        Disease Detected
                      </p>
                      <p className="text-white font-display text-lg font-bold">Tomato Late Blight</p>
                      <p style={{color:'rgba(255,255,255,0.4)'}} className="text-xs font-body mt-0.5">
                        Phytophthora infestans
                      </p>
                    </div>
                    <span className="badge-amber text-xs">Moderate</span>
                  </div>
                  <div className="flex justify-between mb-1.5">
                    <span style={{color:'rgba(255,255,255,0.4)'}} className="text-xs font-body">Model confidence</span>
                    <span style={{color:'var(--green-lt)'}} className="text-xs font-bold">High</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.1)'}}>
                    <div className="h-full rounded-full w-[88%]" style={{background:'linear-gradient(90deg,#2D6A4F,#52B788)'}}/>
                  </div>
                </div>

                {/* Recommended product preview */}
                <div style={{border:'1px solid rgba(255,255,255,0.07)'}} className="rounded-xl p-3">
                  <p style={{color:'rgba(255,255,255,0.3)'}} className="text-[10px] font-body font-bold uppercase tracking-wider mb-2">
                    Top Recommended Treatment
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-body font-medium">Mancozeb 75% WP</p>
                      <p style={{color:'rgba(255,255,255,0.35)'}} className="text-xs font-body">UPL Limited · Verified Seller</p>
                    </div>
                    <div className="text-right">
                      <p style={{color:'var(--gold-lt)'}} className="font-display font-bold">₹380</p>
                      <p style={{color:'rgba(255,255,255,0.3)'}} className="text-[10px] font-body">per 500g</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────────────── */}
      <section style={{background:'var(--bg)'}} className="section">
        <div className="container">
          <div className="max-w-[560px] mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4
                            text-xs font-bold font-body tracking-wider uppercase"
                 style={{background:'#FEE2E2',color:'#991B1B'}}>
              <AlertTriangle className="w-3 h-3"/>
              {lang==='hi'?'समस्या':'The Problem'}
            </div>
            <h2 className="font-display text-4xl font-extrabold mb-4" style={{color:'var(--dark)'}}>
              {lang==='hi'
                ? 'हर साल फसल रोग भारी नुकसान पहुंचाते हैं।'
                : 'Crop disease causes massive, preventable losses every year.'}
            </h2>
            <p className="font-body text-[15px] leading-relaxed" style={{color:'var(--muted)'}}>
              {lang==='hi'
                ? '58% जनसंख्या खेती पर निर्भर है। देर से रोग पहचानना और गलत दवाएं — ये दो सबसे बड़ी वजहें हैं।'
                : '58% of India\'s population depends on agriculture. Late identification and wrong treatments are the two biggest causes of preventable crop loss. Most farmers rely on visual memory or local dealers.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-16">
            {[
              { pct:'20–40%', label:'of annual yield', label_hi:'वार्षिक उत्पादन', sub:'lost to crop diseases each season', bg:'#FEE2E2', color:'#991B1B' },
              { pct:'58%',    label:'of India\'s people', label_hi:'भारत की जनसंख्या', sub:'are directly dependent on farming', bg:'#FEF3C7', color:'#92400E' },
              { pct:'72 hrs', label:'critical window', label_hi:'महत्वपूर्ण समय', sub:'before disease spreads irreversibly', bg:'#DBEAFE', color:'#1E40AF' },
            ].map(s => (
              <div key={s.pct} className="card p-5">
                <div>
                  <p className="font-display text-3xl font-extrabold mb-1" style={{color:s.color}}>{s.pct}</p>
                  <p className="font-body font-semibold text-sm" style={{color:'var(--dark)'}}>
                    {lang==='hi'?s.label_hi:s.label}
                  </p>
                  <p className="font-body text-xs mt-1 leading-relaxed" style={{color:'var(--muted)'}}>{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Solution */}
          <div className="max-w-[560px] mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4
                            text-xs font-bold font-body tracking-wider uppercase"
                 style={{background:'#DCFCE7',color:'#166534'}}>
              <CheckCircle className="w-3 h-3"/>
              {lang==='hi'?'समाधान':'The Solution'}
            </div>
            <h2 className="font-display text-4xl font-extrabold" style={{color:'var(--dark)'}}>
              {lang==='hi'?'निदान से उपचार — एक मिनट में।':'Diagnosis to treatment in under a minute.'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n:'01',
                title: lang==='hi'?'पत्ती की फोटो अपलोड करें':'Upload a leaf photo',
                body: lang==='hi'?'बीमार पत्ती की साफ तस्वीर खींचें।':'Take a clear photo of the affected leaf and upload it — drag, drop, or capture directly.' },
              { n:'02',
                title: lang==='hi'?'AI बीमारी पहचानता है':'AI identifies the disease',
                body: lang==='hi'?'मॉडल बीमारी, गंभीरता और रोगाणु पहचानता है।':'The model identifies disease class, severity level, and the responsible pathogen. A Grad-CAM heatmap shows its focus area.' },
              { n:'03',
                title: lang==='hi'?'सत्यापित दवा ऑर्डर करें':'Order the right treatment',
                body: lang==='hi'?'बीमारी के अनुसार दवाएं, सत्यापित आपूर्तिकर्ताओं से।':'Disease-matched products from verified suppliers. Delivered to your farm.' },
            ].map(s => (
              <div key={s.n} className="card p-6">
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold font-body mb-5"
                     style={{borderColor:'var(--green)',color:'var(--green)'}}>
                  {s.n}
                </div>
                <h3 className="font-display text-lg font-bold mb-2" style={{color:'var(--dark)'}}>{s.title}</h3>
                <p className="font-body text-sm leading-relaxed" style={{color:'var(--muted)'}}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section style={{background:'var(--hero-bg)'}} className="section">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p style={{color:'var(--green-lt)'}} className="text-xs font-body font-bold uppercase tracking-widest mb-3">
                {lang==='hi'?'प्लेटफॉर्म':'Platform'}
              </p>
              <h2 className="font-display text-4xl font-extrabold text-white">
                {lang==='hi'?'एक मंच, सब कुछ।':'What Croply does.'}
              </h2>
            </div>
            <button onClick={() => onNavigate('scan')} className="btn-ghost btn-md flex-shrink-0">
              {lang==='hi'?'शुरू करें →':'Try it now →'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {FEATURES.map((f,i) => (
              <div key={i}
                   style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}
                   className="rounded-2xl p-6 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{background:f.color}}>
                    <f.icon className="w-5 h-5" style={{color:f.iconColor}}/>
                  </div>
                  <div>
                    <p style={{color:'rgba(255,255,255,0.3)'}} className="text-xs font-body font-bold uppercase tracking-wider mb-2">
                      {f.tag}
                    </p>
                    <h3 className="font-display text-lg font-bold text-white mb-2">{f.title}</h3>
                    <p style={{color:'rgba(255,255,255,0.5)'}} className="font-body text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section style={{background:'var(--green)'}} className="section-sm relative overflow-hidden">
        <div className="container relative text-center">
          <Leaf className="w-9 h-9 mx-auto mb-4" style={{color:'rgba(255,255,255,0.3)'}}/>
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-4">
            {lang==='hi'?'अपनी फसल बचाएं।':'Identify disease. Act fast.'}
          </h2>
          <p style={{color:'rgba(255,255,255,0.55)'}} className="font-body text-[15px] mb-8 max-w-md mx-auto">
            {lang==='hi'
              ? 'हर देरी का मतलब है अधिक प्रसार। अभी स्कैन करें।'
              : 'Every hour of delay means more spread. Upload a leaf photo and get a diagnosis in seconds.'}
          </p>
          <button onClick={() => onNavigate('scan')} className="btn-gold btn-lg font-bold mx-auto">
            {lang==='hi'?'स्कैन शुरू करें':'Start Scanning'}
            <ArrowRight className="w-4 h-4"/>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:'var(--dark)',borderTop:'1px solid rgba(255,255,255,0.06)'}}
              className="py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div style={{background:'linear-gradient(135deg,#52B788,#2D6A4F)'}}
               className="w-6 h-6 rounded-md flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white"/>
          </div>
          <span style={{color:'rgba(255,255,255,0.6)'}} className="font-display text-sm font-bold">Croply</span>
        </div>
        <p style={{color:'rgba(255,255,255,0.2)'}} className="text-[11px] font-body opacity-60">
          Hackerz Street 4.0 · Manipal University Jaipur · Agriculture Track #2
        </p>
      </footer>
    </div>
  )
}

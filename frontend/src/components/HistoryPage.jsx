import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Leaf, ShoppingBag, ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, Scan, Trash2, Calendar, ShieldCheck } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const staggerContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }

const SEV = {
  mild:     { cls:'badge-green',     icon:CheckCircle2,  label:'Healthy' },
  moderate: { cls:'badge-amber',     icon:AlertTriangle, label:'Needs Care' },
  severe:   { cls:'badge-red',       icon:TrendingUp,    label:'Serious' },
}

export default function HistoryPage({ onNavigate, lang, scanHistory = [], orders = [], onClearHistory }) {

  if (scanHistory.length === 0) {
    return (
      <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)] flex items-center justify-center">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="container max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-surface shadow-sm mb-6">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">No scans yet</span>
            </div>
            <h1 className="text-5xl md:text-6xl mb-6 font-bold text-dark tracking-tight">{lang === 'hi' ? 'कोई इतिहास नहीं' : 'Scan History'}</h1>
            <p className="text-muted font-medium text-lg max-w-md mx-auto leading-relaxed">
              {lang === 'hi'
                ? 'अभी तक कोई स्कैन नहीं किया गया है'
                : 'You haven\'t scanned any crops yet. Your scan history will appear here once you start.'}
            </p>
          </div>

          <motion.div variants={fadeUp} className="card p-12 text-center border-none rounded-[40px] bg-surface shadow-xl shadow-primary/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 border border-primary/10 border-dashed rounded-[40px] pointer-events-none" />
            
            <div className="w-24 h-24 rounded-3xl mx-auto mb-8 flex items-center justify-center bg-primary/10 border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500 relative z-10">
              <Scan className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-dark relative z-10">{lang === 'hi' ? 'शुरू करें' : 'Ready to Start?'}</h2>
            <p className="text-muted font-medium mb-10 max-w-sm mx-auto text-lg relative z-10">
              {lang === 'hi'
                ? 'अपनी पहली फसल स्कैन करें और अपना इतिहास देखें'
                : 'Scan your first crop to get started. We will save all your reports and recommendations right here.'}
            </p>
            <button onClick={() => onNavigate('scan')} className="btn-primary px-16 py-5 text-xl shadow-xl shadow-primary/20 relative z-10">
              {lang === 'hi' ? 'स्कैन करें' : 'Scan Your First Crop'}
              <ArrowRight className="w-6 h-6 ml-3" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  const totalProducts = scanHistory.reduce((s, h) => s + (h.products || []).length, 0);
  const resolved = scanHistory.filter(h => h.resolved).length;

  return (
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)]">
      <div className="container max-w-5xl pt-6">
        <motion.header initial="hidden" animate="show" variants={fadeUp} className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-surface shadow-sm mb-6">
               <ShieldCheck className="w-4 h-4 text-primary" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Your History</span>
            </div>
            <h1 className="text-5xl md:text-6xl mb-3 font-bold text-dark tracking-tight">{lang === 'hi' ? 'स्कैन इतिहास' : 'My History'}</h1>
            <p className="text-muted font-bold tracking-widest text-xs uppercase bg-surface inline-block px-3 py-1 rounded-md">
              {scanHistory.length} Scans Performed | {resolved} Issues Fixed
            </p>
          </div>
          {onClearHistory && (
             <button onClick={onClearHistory} className="btn text-red-500 hover:text-white bg-red-50 hover:bg-red-500 border border-red-200 rounded-full px-6 py-3 transition-all shadow-sm">
               <Trash2 className="w-5 h-5 mr-3" />
               {lang === 'hi' ? 'इतिहास साफ करें' : 'Clear History'}
             </button>
          )}
        </motion.header>

        {/* Tactical Metrics */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {[
            { val: scanHistory.length, label: lang === 'hi' ? 'कुल स्कैन' : 'Total Scans', color: 'primary' },
            { val: resolved, label: lang === 'hi' ? 'ठीक हुई' : 'Issues Fixed', color: 'primary' },
            { val: totalProducts, label: lang === 'hi' ? 'उपचार' : 'Treatments Applied', color: 'primary' },
          ].map((s, idx) => (
            <motion.div variants={fadeUp} key={idx} className="card p-8 md:p-10 bg-surface flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-primary/5 border-none rounded-[32px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-primary/10 transition-colors" />
              <span className="text-7xl font-black mb-3 text-dark tracking-tighter relative z-10">{s.val}</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-muted relative z-10">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scan List */}
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
          <AnimatePresence>
          {scanHistory.map((scan, i) => {
            const sev = SEV[scan.severity] || SEV.mild;
            const SevIcon = sev.icon;
            return (
              <motion.div variants={fadeUp} exit={{ opacity: 0, scale: 0.95 }} key={scan.id || i} className="card p-8 md:p-10 bg-surface shadow-xl shadow-primary/5 group overflow-hidden relative border-none rounded-[40px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-5">
                      <span className="bg-primary/10 text-primary text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Score #{scan.id || i + 1}</span>
                      <div className="flex items-center gap-2 text-muted text-[11px] font-bold uppercase tracking-widest bg-surface px-3 py-1.5 rounded-full">
                        <Calendar className="w-4 h-4" />
                        {scan.date}
                      </div>
                    </div>
                    
                    <h3 className="text-4xl md:text-5xl mb-6 font-bold text-dark tracking-tight leading-none">
                      {lang === 'hi'
                        ? `${scan.crop_hi || scan.crop} — ${scan.disease_hi || scan.disease}`
                        : `${scan.crop} — ${scan.disease}`}
                    </h3>
                    
                    <div className="mb-6 max-w-md bg-surface p-5 rounded-2xl border border-border">
                      <div className="flex justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Analysis Confidence</span>
                        <span className="text-sm font-black text-primary">{scan.confidence}%</span>
                      </div>
                      <div className="h-2.5 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${scan.confidence}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 flex-shrink-0">
                    <div className={`badge ${sev.cls} py-2.5 px-5 shadow-sm text-xs font-bold`}>
                      <SevIcon className="w-4 h-4" />
                      {sev.label}
                    </div>
                    <span className={`badge py-2.5 px-5 shadow-sm text-xs font-bold ${scan.resolved ? 'badge-green' : 'badge-amber'}`}>
                      {scan.resolved ? 'Resolved' : 'Needs Care'}
                    </span>
                  </div>
                </div>

                {scan.products?.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border flex flex-wrap items-center gap-3 relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted mr-3">Products Recommended:</span>
                    {scan.products.map(p => (
                      <span key={p} className="px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl text-[11px] font-bold text-primary shadow-sm">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
          </AnimatePresence>
        </motion.div>

        {/* Footer Action */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-24 card p-12 md:p-16 bg-dark text-white text-center relative overflow-hidden group border-0 shadow-2xl rounded-[40px] mb-20">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[80px] -mr-64 -mt-64 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[60px] -ml-40 -mb-40 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          
          <div className="relative z-10">
            <Leaf className="w-20 h-20 mx-auto mb-8 text-primary/80 drop-shadow-lg" />
            <h3 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">Want to check another crop?</h3>
            <p className="text-white/60 font-bold uppercase tracking-[0.2em] text-[11px] mb-12">Scan now to keep your farm safe</p>
            <button onClick={() => onNavigate('scan')} className="btn-primary px-16 py-6 text-xl shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              Start New Scan
              <ArrowRight className="w-6 h-6 ml-3" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getRecommendations } from '../services/api.js'
import KisanBot from './KisanBot.jsx'
import DiseaseProgressionTracker from './DiseaseProgressionTracker.jsx'
import {
  ArrowLeft, Share2, AlertTriangle, CheckCircle2,
  Zap, Wind, FlaskConical, MessageCircle, ShoppingBag
} from 'lucide-react'

const SEV = {
  mild:     { label:'Mild',     label_hi:'हल्का',  cls:'bg-green-100 text-green-700 border-green-200', icon:CheckCircle2,  desc:'Early stage. Easy to fix with basic care.' },
  moderate: { label:'Moderate', label_hi:'मध्यम', cls:'bg-amber-100 text-amber-700 border-amber-200', icon:AlertTriangle, desc:'Active problem. Needs attention soon to prevent spread.' },
  severe:   { label:'Severe',   label_hi:'गंभीर', cls:'bg-red-100 text-red-700 border-red-200',   icon:Zap,           desc:'Serious problem. Immediate action needed to save the crop.' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
}
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

function ProductCard({ product, onAddToCart, lang }) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <motion.div variants={fadeUp} className="card p-6 md:p-8 bg-surface shadow-xl shadow-primary/5 border-none rounded-[32px]">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {product.organic_certified && (
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Organic Safe</span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted border border-border px-3 py-1 rounded-full">{product.manufacturer}</span>
          </div>
          <h4 className="text-3xl font-bold text-dark leading-tight">{product.name}</h4>
        </div>
        <div className="text-left md:text-right bg-surface px-6 py-3 rounded-2xl border border-border">
          <div className="text-3xl font-black text-primary mb-1">₹{product.price_per_unit}</div>
          <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Per {product.unit}</div>
        </div>
      </div>

      <div className="p-5 md:p-6 bg-primary/5 border border-primary/10 rounded-[24px] mb-8 relative">
        <div className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-md">
           <span className="text-xl leading-none">💡</span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3 ml-4">Why we recommend this</p>
        <p className="text-base font-medium leading-relaxed italic text-dark/80 ml-4">
          "{product.why_recommended}"
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-surface rounded-[20px] shadow-sm border border-border">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">How much to use</p>
          <p className="font-bold text-base text-dark">{product.dosage}</p>
        </div>
        <div className="p-4 bg-surface rounded-[20px] shadow-sm border border-border">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">When to harvest</p>
          <p className="font-bold text-base text-dark">{product.pre_harvest_interval}</p>
        </div>
      </div>

      <button onClick={handleAdd}
              className={`btn-lg w-full font-bold uppercase tracking-widest text-sm transition-all shadow-xl ${added ? 'btn-outline border-primary text-primary shadow-none' : 'btn-primary'}`}>
        {added ? 'Added to Cart' : 'Add to Helper Cart'}
      </button>
    </motion.div>
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
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)]">
      <div className="container max-w-6xl pt-4">
        
        {/* Navigation */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <button onClick={() => onNavigate('scan')} className="btn text-muted hover:text-dark hover:bg-surface border border-transparent hover:border-border rounded-full px-6 py-3 w-full sm:w-auto">
            <ArrowLeft className="w-5 h-5 mr-3"/>
            {lang==='hi'?'नया स्कैन':'Back to Scan'}
          </button>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 w-full sm:w-auto">
             <div className="hidden lg:block text-right bg-surface px-4 py-2 rounded-2xl shadow-sm border border-border">
                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Scan ID</p>
                <p className="text-xs font-bold text-primary">{result.scan_id}</p>
             </div>
              <button className="btn-outline border-border bg-surface shadow-sm hover:border-primary hover:text-primary rounded-full px-6 py-3">
                 <Share2 className="w-4 h-4 mr-2"/>
                 {lang === 'hi' ? 'साझा करें' : 'Share Results'}
              </button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[450px_1fr] gap-10 xl:gap-14 items-start pb-20">
          
          {/* Left: What we found */}
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8 sticky top-28">
            <motion.div variants={fadeUp} className="card overflow-hidden border-none p-0 bg-surface shadow-2xl shadow-primary/10 rounded-[40px]">
              
              <div className="relative aspect-square md:aspect-video lg:aspect-square">
                <img src={imagePreview} alt="" className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent" />
                
                <div className="absolute top-6 right-6">
                   <div className="px-5 py-2.5 rounded-2xl bg-surface/20 backdrop-blur-md border border-white/30 text-white font-black text-sm shadow-xl tracking-wide">
                      {result.crop}
                   </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                    <div className={`px-5 py-2.5 rounded-full border-2 flex items-center gap-2 font-black text-xs uppercase tracking-wider shadow-2xl ${sev.cls}`}>
                       <SevIcon className="w-4 h-4" />
                       {lang === 'hi' ? sev.label_hi : sev.label} Issue
                    </div>
                </div>
              </div>

              <div className="p-8 md:p-10">
                  <h1 className="text-4xl md:text-5xl font-bold mb-3 text-dark leading-tight tracking-tight">
                     {lang === 'hi' ? result.disease_name_hi : result.disease_name}
                  </h1>
                  <p className="text-primary font-bold text-sm uppercase tracking-widest mb-8">Identified Issue: {result.pathogen || 'Common Issue'}</p>
                  
                  <div className={`p-6 rounded-[24px] mb-10 ${sev.cls.replace('border-','border-2 border-')}`}>
                     <div className="flex items-center gap-3 mb-2 font-black uppercase tracking-widest text-[11px]">
                        <AlertTriangle className="w-4 h-4" />
                        Important Note
                     </div>
                    <p className="font-medium leading-relaxed">{sev.desc}</p>
                 </div>

                  <div className="space-y-8">
                    <div>
                       <h3 className="text-[11px] font-black text-muted uppercase tracking-widest mb-4">About this issue</h3>
                       <p className="text-lg leading-relaxed text-dark/80 font-medium">{lang === 'hi' ? result.description_hi : result.description}</p>
                    </div>

                     <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-5 p-5 bg-surface border border-border shadow-sm rounded-3xl">
                           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                             <FlaskConical className="w-6 h-6 text-primary" />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Probable Cause</p>
                              <p className="font-bold text-dark text-base">{result.causes}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-5 p-5 bg-surface border border-border shadow-sm rounded-3xl">
                           <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                             <Wind className="w-6 h-6 text-accent" />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Spread Rate</p>
                              <p className="font-bold text-dark text-base">{result.spread_rate}</p>
                           </div>
                        </div>
                     </div>
                 </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp}>
              <DiseaseProgressionTracker result={result} lang={lang} />
            </motion.div>
          </motion.div>

          {/* Right: Solutions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mt-8 lg:mt-0">
            <div className="flex gap-2 mb-10 p-2 bg-surface shadow-md border border-primary/10 rounded-[28px]">
               <button 
                  onClick={() => setTab('treatment')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[20px] font-bold uppercase tracking-wider text-[11px] transition-all ${tab === 'treatment' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-primary hover:bg-primary/5'}`}
               >
                  <ShoppingBag className="w-4 h-4" />
                  {lang === 'hi' ? 'सुझाए गए समाधान' : 'Helper Carts'}
               </button>
               <button 
                  onClick={() => setTab('bot')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[20px] font-bold uppercase tracking-wider text-[11px] transition-all ${tab === 'bot' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-primary hover:bg-primary/5'}`}
               >
                  <MessageCircle className="w-4 h-4" />
                  {lang === 'hi' ? 'मदद मांगें' : 'Chat & Ask Help'}
               </button>
            </div>

            {tab === 'treatment' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                 <div className="flex items-end justify-between px-2 mb-8">
                    <div>
                      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-dark mb-2">Helper Kits</h2>
                      <p className="text-muted font-medium">Ready-made solutions to fix the issue.</p>
                    </div>
                    <span className="text-[12px] font-black text-primary bg-primary/10 px-4 py-2 rounded-full uppercase tracking-widest">{products.length} Found</span>
                 </div>

                 {loading ? (
                   <div className="space-y-6">
                      {[1,2,3].map(i => (
                        <div key={i} className="card h-64 skeleton rounded-[32px] border-none shadow-xl" />
                      ))}
                   </div>
                 ) : (
                    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid gap-8">
                       {products.map(p => (
                         <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} lang={lang} />
                       ))}
                    </motion.div>
                 )}
              </motion.div>
            )}

            {tab === 'bot' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-0 overflow-hidden bg-surface shadow-2xl shadow-primary/10 border-none rounded-[40px]">
                 <div className="bg-primary text-white p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-surface/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3" />
                    <h3 className="text-4xl font-bold mb-2 relative z-10">Croply Assistant</h3>
                    <p className="text-white/80 text-[11px] font-black uppercase tracking-widest relative z-10">Chat about your scan results</p>
                 </div>
                 <div className="p-4 bg-surface">
                    <KisanBot result={result} lang={lang} />
                 </div>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  )
}
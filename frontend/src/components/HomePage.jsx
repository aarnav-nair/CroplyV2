import { ArrowRight, Zap, Shield, MapPin, TrendingUp, CheckCircle, Leaf, Camera } from 'lucide-react'
import { motion } from 'framer-motion'

const FEATURES = [
  {
    icon: Zap, color:'#FEF08A', iconColor:'#EAB308',
    tag:'Fast AI', title:'Quick Health Check',
    body:'We use smart AI to find diseases in your crops in just a few seconds.',
  },
  {
    icon: Shield, color:'#DCFCE7', iconColor:'#16A34A',
    tag:'Trustworthy', title:'Easy to Understand',
    body:'Get clear explanations of what the AI found and why it recommends specific treatments.',
  },
  {
    icon: TrendingUp, color:'#FEF08A', iconColor:'#EAB308',
    tag:'Growth', title:'Best Treatments',
    body:'Get the exact solutions for your specific crop problems to help them grow strong.',
  },
  {
    icon: MapPin, color:'#DCFCE7', iconColor:'#16A34A',
    tag:'Community', title:'Local Alerts',
    body:'See if there are any crop diseases spreading in your area so you can protect your farm.',
  },
]

// Framer Motion Variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
}
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
}
const scaleUp = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100 } }
}

export default function HomePage({ onNavigate, lang }) {
  return (
    <div className="overflow-hidden bg-bg">

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-hero-bg rounded-b-[40px] md:rounded-b-[80px] shadow-2xl">
        <div className="container relative z-10">
          <motion.div 
            variants={staggerContainer} initial="hidden" animate="show"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-8 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-bold text-accent-lt uppercase tracking-widest">
                {lang === 'hi' ? 'आपका स्मार्ट कृषि साथी' : 'Your Smart Farming Partner'}
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl text-white mb-8 leading-[1.1] tracking-tight">
              {lang === 'hi' ? 'अपनी फसल की सेहत ' : 'Check your crop\'s health '}
              <span className="text-accent italic">{lang === 'hi' ? 'सेकंडों में' : 'in seconds'}</span>
              {lang === 'hi' ? ' जाँचें।' : '.'}
            </motion.h1>
            
            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-white/80 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              {lang === 'hi' 
                ? 'बीमारियों का तुरंत पता लगाएं, आसान समाधान पाएं और अपनी फसल को सुरक्षित रखें।' 
                : 'Identify diseases instantly, get easy treatments, and protect your farm with the help of AI.'}
            </motion.p>

            <motion.div variants={scaleUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => onNavigate('scan')} 
                className="btn-gold btn-lg text-lg px-12 py-5 shadow-2xl w-full sm:w-auto"
              >
                <Camera className="w-6 h-6 mr-3" />
                {lang === 'hi' ? 'अभी जांचें' : 'Check Crop Now'}
              </button>
              <button 
                onClick={() => onNavigate('map')} 
                className="btn text-white bg-white/10 hover:bg-white/20 border border-white/20 text-lg px-10 py-5 w-full sm:w-auto"
              >
                {lang === 'hi' ? 'क्षेत्रीय अलर्ट मैप' : 'View Alert Map'}
              </button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Organic Background Visuals */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/30 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
        <motion.div 
          animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] opacity-10 pointer-events-none select-none"
        >
           <Leaf className="w-full h-full text-white" />
        </motion.div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────────────────── */}
      <section className="py-24 relative z-20">
        <div className="container">
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {FEATURES.map((f, idx) => (
              <motion.div key={idx} variants={scaleUp} className="card card-hover flex flex-col items-start bg-surface shadow-xl border-none">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: f.color }}>
                  <f.icon className="w-7 h-7" style={{ color: f.iconColor }} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2">{f.tag}</span>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-dark/70 font-medium leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Steps ────────────────────────────────────────────────────── */}
      <section className="section bg-surface/50 overflow-hidden rounded-[40px] md:rounded-[80px] mx-4 mb-24 shadow-sm border border-border">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-20 text-center"
          >
             <h2 className="text-5xl md:text-6xl text-dark">
                {lang === 'hi' ? 'आपके लिए आसान कदम' : 'Easy steps for you'}
             </h2>
             <div className="h-1.5 w-24 bg-primary mx-auto mt-8 rounded-full" />
          </motion.div>

          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              { n: '1', title: 'Take a Photo', body: 'Use your phone to take a clear picture of the sick plant leaf.' },
              { n: '2', title: 'AI Analysis', body: 'Our smart system instantly figures out what is wrong with it.' },
              { n: '3', title: 'Get Helper Carts', body: 'We suggest exactly what to buy and do to fix the problem.' },
            ].map((s, i) => (
               <motion.div key={s.n} variants={fadeUp} className="relative text-center group cursor-default p-8 bg-surface rounded-3xl shadow-sm hover:shadow-xl transition-all border border-border">
                 <div className="w-16 h-16 mx-auto bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black mb-6 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                   {s.n}
                 </div>
                 <h3 className="text-2xl font-bold mb-4">{s.title}</h3>
                 <p className="text-dark/70 text-lg font-medium leading-relaxed">
                   {s.body}
                 </p>
               </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-primary pt-32 pb-40 relative overflow-hidden rounded-t-[40px] md:rounded-t-[80px] shadow-2xl">
        <div className="container relative z-10 text-center">
          <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring' }}>
            <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-8 shadow-2xl">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold text-white mb-8"
          >
            {lang==='hi'?'अपनी फसल सुरक्षित करें।':'Protect your harvest today.'}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-white/80 text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-medium"
          >
            {lang==='hi'
              ? 'देरी न करें, अपनी फसल को स्वस्थ बनाए रखने के लिए अभी जाँच करें।'
              : 'Don\'t wait. Check your crop now and get easy solutions to keep your farm healthy and growing.'}
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            onClick={() => onNavigate('scan')} 
            className="btn-gold btn-lg text-xl px-14 py-6 shadow-2xl"
          >
            {lang==='hi'?'जाँच शुरू करें':'Start My First Check'}
            <ArrowRight className="w-6 h-6 ml-3" />
          </motion.button>
        </div>
        
        {/* Soft Organic Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-surface py-12 border-t border-border mt-[-40px] relative z-20 rounded-t-[40px] md:rounded-t-[80px]">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
               <span className="text-dark font-black text-2xl tracking-tight block">Croply<span className="text-accent">AI</span></span>
               <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Your Helpful Farming Partner</span>
            </div>
          </div>
          
          <div className="text-center md:text-right">
             <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2 flex items-center justify-center md:justify-end gap-2">
               <CheckCircle className="w-4 h-4 text-primary" /> Systems Online & Healthy
             </p>
             <p className="text-dark/40 text-[10px] font-medium uppercase tracking-wider">
                CroplyV2 // Growing Better Together
             </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

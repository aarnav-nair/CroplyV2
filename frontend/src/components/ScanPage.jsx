import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Camera, AlertCircle, ImagePlus, X, CheckCircle, Scan, Leaf } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { detectDisease } from '../services/api.js'

const PHOTO_TIPS = [
  { title: 'Good light', body: 'Use natural daylight. Avoid dark shadows on the leaf.' },
  { title: 'One leaf', body: 'Take a clear photo of just one affected leaf.' },
  { title: 'Show the problem', body: 'Make sure the spots or damage are easy to see.' },
  { title: 'Steady hands', body: 'Hold your phone steady so the photo isn\'t blurry.' },
]

export default function ScanPage({ onResult, lang }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [step, setStep] = useState(1)
  const [error, setError] = useState(null)
  const [progressPct, setProgressPct] = useState(0)

  const onDrop = useCallback((accepted, rejected) => {
    setError(null)
    if (rejected.length) {
      setError('Please upload a JPEG, PNG, or WebP image under 10 MB.')
      return
    }
    const f = accepted[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  async function handleScan() {
    if (!file) return
    setStep(2)
    setError(null)

    let pct = 0
    const interval = setInterval(() => {
      pct += 15
      setProgressPct(Math.min(pct, 94))
    }, 380)

    try {
      const result = await detectDisease(file)
      clearInterval(interval)
      setProgressPct(100)
      await new Promise(r => setTimeout(r, 600))
      onResult(result, preview)
    } catch (e) {
      clearInterval(interval)
      setStep(1)
      const msg = e?.message || 'Detection failed'
      setError(msg)
    }
  }

  function reset() {
    setFile(null); setPreview(null); setStep(1); setError(null)
    setProgressPct(0)
  }

  return (
    <div className="section-sm overflow-hidden bg-bg min-h-[calc(100vh-80px)]">
      <div className="container max-w-[800px] pt-12">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-white shadow-sm mb-6">
            <Scan className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {lang === 'hi' ? 'स्मार्ट जाँच' : 'Smart API Scan'}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl mb-4 text-dark tracking-tight">
            {lang === 'hi' ? 'अपनी फसल की जाँच करें' : 'Check Your Crop'}
          </h1>
          <p className="text-muted font-medium max-w-md mx-auto text-lg leading-relaxed">
            {lang === 'hi'
              ? 'बीमार पत्ती की फोटो लें और एआई से मदद पाएं'
              : 'Take a photo of a leaf to find out what is wrong and how to fix it easily.'}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 rounded-[24px] bg-[#FEF2F2] border border-[#FCA5A5] flex items-start gap-4 shadow-sm mx-4 md:mx-0"
            >
              <AlertCircle className="w-6 h-6 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base text-[#991B1B] mb-1 font-bold">Oops, something went wrong</h4>
                <p className="font-medium text-[#B91C1C]/80 text-sm">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="card p-6 md:p-12 mb-16 bg-surface shadow-xl rounded-[40px] border-none mx-4 md:mx-0 relative overflow-hidden"
        >
          {/* Decorative blurry background inside the card */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />

          {step === 1 && (
            <div className="relative z-10">
              {!preview ? (
                <div {...getRootProps()}
                     className={`border-2 border-dashed rounded-[32px] p-12 md:p-16 text-center cursor-pointer transition-all duration-300
                       ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02] shadow-inner' : 'border-primary/20 bg-gray-50/50 hover:border-primary hover:bg-primary/5'}`}>
                  <input {...getInputProps()}/>
                  <div className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center bg-white shadow-xl border border-primary/10">
                    <ImagePlus className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold text-dark mb-4">
                    {isDragActive
                      ? (lang === 'hi' ? 'यहाँ फोटो छोड़ें' : 'Drop Image Here')
                      : (lang === 'hi' ? 'फोटो यहाँ लाएं या चुनें' : 'Tap to Select Photo')}
                  </h3>
                  <p className="font-medium text-muted mb-8 text-sm">
                    {lang === 'hi' ? 'अधिकतम आकार: 10MB' : 'Max File Size: 10MB (JPG, PNG, WEBP)'}
                  </p>
                  <div className="btn-primary btn-lg shadow-xl shadow-primary/20">
                    <Upload className="w-5 h-5 mr-2" />
                    {lang === 'hi' ? 'फोटो चुनें' : 'Choose Photo'}
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden rounded-[32px] border-2 border-primary/10 bg-surface shadow-sm p-2">
                  <div className="relative rounded-[24px] overflow-hidden">
                    <img src={preview} alt="Leaf preview" className="w-full object-cover aspect-square md:aspect-video"/>
                    
                    <button onClick={reset}
                            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-surface/90 backdrop-blur-md text-dark flex items-center justify-center hover:bg-surface hover:text-red-500 transition-colors shadow-xl">
                      <X className="w-6 h-6"/>
                    </button>
                    <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider shadow-lg">
                      My Photo
                    </div>
                  </div>
                  <div className="p-4 md:p-6 pb-2">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button onClick={reset} className="btn-outline flex-1 py-4 text-sm bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:text-dark">
                        {lang === 'hi' ? 'फोटो बदलें' : 'Retake Photo'}
                      </button>
                      <button onClick={handleScan} className="btn-primary flex-1 py-4 text-base shadow-xl shadow-primary/20">
                        <Camera className="w-5 h-5 mr-3"/>
                        {lang === 'hi' ? 'जाँच करें' : 'Analyze My Crop'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 md:py-20 text-center relative z-10">
              <div className="relative w-72 h-72 mx-auto mb-16 rounded-[48px] overflow-hidden border-4 border-primary/20 shadow-2xl group">
                {preview && <img src={preview} alt="" className="w-full h-full object-cover filter brightness-90"/>}
                
                {/* Organic Scanning Animation */}
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] mix-blend-overlay" />
                
                {/* Floating scan line */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }} 
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                  className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-md"
                />
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }} 
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
                  className="absolute left-0 right-0 h-1 bg-white shadow-[0_0_20px_var(--primary)]"
                />

              </div>

              <h2 className="text-3xl md:text-5xl font-bold mb-8 text-dark tracking-tight">
                {lang === 'hi' ? 'पत्ती की जाँच हो रही है...' : 'Checking your leaf...'}
              </h2>
              
              <div className="max-w-md mx-auto">
                <div className="h-4 bg-surface rounded-full overflow-hidden shadow-inner border border-border p-0.5 mb-3">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ ease: "easeOut" }}
                    className="h-full bg-primary rounded-full relative overflow-hidden"
                  >
                     <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_1s_infinite_linear]" />
                  </motion.div>
                </div>
              </div>
              <p className="font-bold text-[11px] uppercase tracking-[0.2em] text-primary mt-4">
                AI Intelligence Processing: {Math.round(progressPct)}%
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Info Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 mx-4 md:mx-0 pb-20"
        >
          <div className="card bg-surface shadow-xl border-none p-8 md:p-10 rounded-[32px]">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              {lang === 'hi' ? 'अच्छी फोटो के लिए टिप्स' : 'Tips for a Great Photo'}
            </h3>
            <ul className="space-y-6">
              {PHOTO_TIPS.map((t, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-0.5 shadow-md shadow-primary/30">
                    {i + 1}
                  </span>
                  <div>
                    <span className="block font-bold text-lg text-dark leading-none mb-2">{t.title}</span>
                    <span className="text-muted leading-relaxed font-medium">{t.body}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="card bg-surface shadow-sm border border-border p-8 md:p-10 rounded-[32px] flex flex-col justify-center relative overflow-hidden">
            <Leaf className="absolute -bottom-10 -right-10 w-64 h-64 text-primary/5 -rotate-12" />
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shadow-sm border border-primary/10">
                <Scan className="w-5 h-5 text-primary" />
              </div>
              {lang === 'hi' ? 'समर्थित फसलें' : 'Crops We Check'}
            </h3>
            <div className="flex flex-wrap gap-2.5 relative z-10">
              {['Tomato', 'Potato', 'Rice', 'Wheat', 'Corn', 'Apple', 'Grape', 'Pepper', 'Peach'].map(s => (
                <span key={s} className="px-4 py-2 bg-surface border border-border shadow-sm rounded-xl text-[11px] font-bold uppercase tracking-wider text-dark/70 hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors cursor-default">
                  {s}
                </span>
              ))}
              <span className="px-4 py-2 bg-primary text-white shadow-md shadow-primary/20 rounded-xl text-[11px] font-bold uppercase tracking-wider">
                +12 More
              </span>
            </div>
            <p className="mt-10 text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] relative z-10">
              All common regional crops supported
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
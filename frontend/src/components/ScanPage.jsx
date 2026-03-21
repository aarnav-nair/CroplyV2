import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Camera, AlertCircle, Loader2, ImagePlus, X, CheckCircle, Info } from 'lucide-react'
import { detectDisease } from '../services/api.js'
import toast from 'react-hot-toast'

const STEPS = [
  { n:1, label:'Upload Photo',  label_hi:'फोटो अपलोड' },
  { n:2, label:'AI Analysis',   label_hi:'AI जांच' },
  { n:3, label:'View Results',  label_hi:'परिणाम' },
]

const PHOTO_TIPS = [
  { icon:'☀️', title:'Good lighting',     body:'Natural daylight or shade. Avoid harsh shadows across the leaf.' },
  { icon:'🍃', title:'Single leaf',        body:'Fill most of the frame with one affected leaf.' },
  { icon:'🔍', title:'Show the damage',    body:'The diseased area should be clearly visible and in focus.' },
  { icon:'📱', title:'Hold steady',        body:'Tap to focus before shooting. Blurry images reduce accuracy.' },
]

function StepBar({ step }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold font-body transition-all
              ${step > s.n  ? 'bg-green border-green text-white' : step===s.n ? 'border-green text-green bg-white' : 'border-gray-200 text-gray-400 bg-white'}`}
                 style={step>s.n?{background:'var(--green)',borderColor:'var(--green)'}:step===s.n?{borderColor:'var(--green)',color:'var(--green)'}:{}}>
              {step > s.n ? <CheckCircle className="w-3.5 h-3.5"/> : s.n}
            </div>
            <span className={`text-xs font-body font-medium hidden sm:block
              ${step===s.n?'text-green':'text-gray-400'}`}
                  style={step===s.n?{color:'var(--green)'}:{}}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length-1 && (
            <div className="w-12 h-px" style={{background: step>s.n ? 'var(--green)' : 'var(--border)'}}/>
          )}
        </div>
      ))}
    </div>
  )
}

const PROCESSING_MESSAGES = [
  'Loading EfficientNet-B0 model…',
  'Preprocessing image (224×224)…',
  'Running forward pass…',
  'Computing class probabilities…',
  'Generating Grad-CAM heatmap…',
  'Building recommendations…',
]

export default function ScanPage({ onResult, lang }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [step, setStep] = useState(1)
  const [error, setError] = useState(null)
  const [progressMsg, setProgressMsg] = useState(0)
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
    accept: { 'image/jpeg':[], 'image/png':[], 'image/webp':[] },
    maxFiles: 1,
    maxSize: 10*1024*1024,
  })

  async function handleScan() {
    if (!file) return
    setStep(2)
    setError(null)

    // Animate progress messages
    let pct = 0
    const interval = setInterval(() => {
      pct += 100 / PROCESSING_MESSAGES.length
      setProgressPct(Math.min(pct, 94))
      setProgressMsg(m => Math.min(m+1, PROCESSING_MESSAGES.length-1))
    }, 380)

    try {
      const result = await detectDisease(file)
      clearInterval(interval)
      setProgressPct(100)
      await new Promise(r => setTimeout(r, 400))
      onResult(result, preview)
    } catch {
      clearInterval(interval)
      setStep(1)
      setError('Detection failed. Please try again with a clearer photo.')
    }
  }

  function reset() {
    setFile(null); setPreview(null); setStep(1); setError(null)
    setProgressMsg(0); setProgressPct(0)
  }

  return (
    <div className="container py-12 max-w-[680px]">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-extrabold mb-2" style={{color:'var(--dark)'}}>
          {lang==='hi'?'फसल स्कैन करें':'Scan Your Crop'}
        </h1>
        <p className="font-body text-sm" style={{color:'var(--muted)'}}>
          {lang==='hi'
            ? 'बीमार पत्ती की तस्वीर अपलोड करें — AI 3 सेकंड में पहचानेगा'
            : 'Upload a photo of the affected leaf for an instant AI diagnosis.'}
        </p>
      </div>

      <StepBar step={step}/>

      {/* Step 1: Upload */}
      {step===1 && (
        <div>
          {!preview ? (
            <div {...getRootProps()}
                 className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                   ${isDragActive ? 'border-green-500 bg-green-50/60 scale-[1.01]' : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50/30'}`}
                 style={{borderColor: isDragActive?'var(--green-lt)':undefined}}>
              <input {...getInputProps()}/>
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                   style={{background:'var(--bg)'}}>
                <ImagePlus className="w-8 h-8" style={{color:'var(--green-mid)'}}/>
              </div>
              <p className="font-display text-xl font-bold mb-1" style={{color:'var(--dark)'}}>
                {isDragActive
                  ? (lang==='hi'?'यहाँ छोड़ें':'Drop the image here')
                  : (lang==='hi'?'पत्ती की फोटो अपलोड करें':'Drag & drop or click to upload')}
              </p>
              <p className="font-body text-sm mb-5" style={{color:'var(--muted)'}}>
                {lang==='hi'?'JPEG, PNG, WebP — 10MB तक':'JPEG, PNG, or WebP · Max 10 MB'}
              </p>
              <div className="btn-primary btn-md inline-flex">
                <Upload className="w-4 h-4"/>
                {lang==='hi'?'फाइल चुनें':'Choose File'}
              </div>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="relative">
                <img src={preview} alt="Leaf preview" className="w-full object-cover max-h-72"/>
                <button onClick={reset}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                  <X className="w-4 h-4"/>
                </button>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                  <p className="text-white text-xs font-body">{file?.name}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{background:'#DCFCE7',border:'1px solid #BBF7D0'}}>
                  <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0"/>
                  <p className="text-sm font-body font-medium text-green-800">
                    {lang==='hi'?'फोटो तैयार है। AI से जांच करें।':'Image ready. Click below to run AI analysis.'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={reset} className="btn-outline btn-md flex-1">
                    {lang==='hi'?'बदलें':'Change Photo'}
                  </button>
                  <button onClick={handleScan} className="btn-primary btn-md flex-1 font-bold">
                    <Camera className="w-4 h-4"/>
                    {lang==='hi'?'AI से जांच करें':'Run AI Diagnosis'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl" style={{background:'#FEE2E2',border:'1px solid #FECACA'}}>
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5"/>
              <p className="text-sm font-body text-red-700">{error}</p>
            </div>
          )}

          {/* Photo tips */}
          <div className="mt-6 card">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4" style={{color:'var(--green-mid)'}}/>
              <h3 className="font-display text-base font-bold" style={{color:'var(--dark)'}}>
                {lang==='hi'?'बेहतर परिणाम के लिए सुझाव':'Tips for better accuracy'}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PHOTO_TIPS.map((t,i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{background:'var(--bg)'}}>
                  <span className="text-xl flex-shrink-0">{t.icon}</span>
                  <div>
                    <p className="font-body text-xs font-semibold mb-0.5" style={{color:'var(--dark)'}}>{t.title}</p>
                    <p className="font-body text-xs leading-snug" style={{color:'var(--muted)'}}>{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported crops */}
          <div className="mt-4 card">
            <p className="text-xs font-body font-bold uppercase tracking-wider mb-3" style={{color:'var(--muted)'}}>
              {lang==='hi'?'समर्थित फसलें':'Supported crops'}
            </p>
            <div className="flex flex-wrap gap-2">
              {['🍅 Tomato','🥔 Potato','🌾 Rice','🌾 Wheat','🌽 Corn','🍎 Apple','🍇 Grape','🌶 Pepper','🍑 Peach','🍓 Strawberry'].map(c => (
                <span key={c} className="font-body text-xs px-3 py-1.5 rounded-full"
                      style={{background:'var(--bg)',border:'1px solid var(--border)',color:'var(--ink-soft)'}}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step===2 && (
        <div className="card p-8 text-center">
          {/* Scan animation */}
          <div className="relative w-48 h-48 mx-auto mb-8 rounded-2xl overflow-hidden scan-container"
               style={{border:'2px solid var(--green-lt)'}}>
            {preview && <img src={preview} alt="" className="w-full h-full object-cover"/>}
            <div className="scan-laser" style={{top:'0%'}}/>
            <div className="absolute inset-0 rounded-2xl"
                 style={{background:'linear-gradient(180deg,rgba(82,183,136,0.1) 0%,transparent 40%,transparent 60%,rgba(82,183,136,0.1) 100%)'}}/>
            {/* Corner markers */}
            {['top-2 left-2','top-2 right-2','bottom-2 left-2','bottom-2 right-2'].map((p,i) => (
              <div key={i} className={`absolute ${p} w-5 h-5`}>
                <div className="w-2.5 h-2.5 border-t-2 border-l-2 absolute top-0 left-0"
                     style={{borderColor:'var(--green-lt)',transform:i%2===1?'scaleX(-1)':i>1?'scaleY(-1)':''}}/>
              </div>
            ))}
          </div>

          <h2 className="font-display text-2xl font-bold mb-2" style={{color:'var(--dark)'}}>
            {lang==='hi'?'AI जांच कर रहा है…':'Analysing your crop…'}
          </h2>
          <p className="font-body text-sm mb-6" style={{color:'var(--muted)'}}>
            {PROCESSING_MESSAGES[progressMsg]}
          </p>

          {/* Progress bar */}
          <div className="progress-bar max-w-xs mx-auto mb-2">
            <div className="progress-fill" style={{width:`${progressPct}%`, animation:'none', transition:'width 0.4s ease'}}/>
          </div>
          <p className="font-body text-xs font-bold" style={{color:'var(--green-mid)'}}>
            {Math.round(progressPct)}%
          </p>

          {/* Processing details */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm mx-auto">
            {[
              {label:'Model', value:'EfficientNet-B0'},
              {label:'Classes', value:'38 diseases'},
              {label:'Dataset', value:'PlantVillage'},
            ].map(d => (
              <div key={d.label} className="p-3 rounded-xl" style={{background:'var(--bg)'}}>
                <p className="font-body text-[10px] font-bold uppercase tracking-wider mb-1" style={{color:'var(--muted)'}}>{d.label}</p>
                <p className="font-body text-xs font-semibold" style={{color:'var(--dark)'}}>{d.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

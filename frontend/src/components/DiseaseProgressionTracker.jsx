import { useState, useEffect } from 'react'
import { TrendingUp, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

function getSpreadFactor(spreadRate) {
  const r = (spreadRate || '').toLowerCase()
  if (r.includes('very fast') || r.includes('extremely')) return 3
  if (r.includes('fast'))     return 2.5
  if (r.includes('moderate')) return 1.5
  if (r.includes('slow'))     return 1
  return 1.8
}

function getSeverityScore(severity) {
  if (severity === 'severe')   return 3
  if (severity === 'moderate') return 2
  return 1
}

function clamp(n) { return Math.min(4, Math.max(0, Math.round(n))) }

const LEVELS_EN = ['Mild', 'Moderate', 'Severe', 'Critical', 'Crop Loss']
const LEVELS_HI = ['हल्का', 'मध्यम', 'गंभीर', 'संकट', 'नष्ट']
const COLORS     = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-red-800']
const TEXT_COLORS = ['text-green-600', 'text-yellow-600', 'text-orange-600', 'text-red-600', 'text-red-900']
const BORDER_COLORS = ['border-green-200', 'border-yellow-200', 'border-orange-200', 'border-red-200', 'border-red-300']
const BG_COLORS = ['bg-green-50', 'bg-yellow-50', 'bg-orange-50', 'bg-red-50', 'bg-red-100']
const LOSS_PCT   = [8, 22, 52, 88]
const LOSS_LABEL = ['5–10%', '15–30%', '40–65%', '80–100%']

export default function DiseaseProgressionTracker({ result, lang }) {
  const hi     = lang === 'hi'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const spread = getSpreadFactor(result.spread_rate)
  const base   = getSeverityScore(result.severity)

  const levels = [
    clamp(base - 1),
    clamp(base + spread * 0.5),
    clamp(base + spread * 1.2),
    clamp(base + spread * 2.2),
  ]

  const DAYS    = hi ? ['अभी', '3 दिन', '7 दिन', '14 दिन'] : ['Now', 'Day 3', 'Day 7', 'Day 14']
  const LEVELS  = hi ? LEVELS_HI : LEVELS_EN

  return (
    <div className="card bg-white shadow-xl shadow-primary/5 border-none p-6 md:p-8 rounded-[32px]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
           <TrendingUp className="w-4 h-4 text-accent" />
        </div>
        <h3 className="text-xl font-bold text-dark tracking-tight">
          {hi ? 'उपचार न हो तो क्या होगा' : 'If Left Untreated'}
        </h3>
        <span className="ml-auto font-bold text-[10px] px-3 py-1 bg-accent/10 text-accent rounded-full uppercase tracking-widest border border-accent/20 shadow-sm">
          {result.spread_rate || (hi ? 'मध्यम' : 'Moderate')} {hi ? 'फैलाव' : 'spread'}
        </span>
      </div>

      {/* 4-column strip */}
      <div className="grid grid-cols-4 gap-2 md:gap-3 mb-6">
        {levels.map((lvl, i) => {
          const isNow = i === 0
          return (
            <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl py-4 px-1 border ${BG_COLORS[lvl]} ${BORDER_COLORS[lvl]} shadow-sm ${isNow ? 'border-2 ring-2 ring-primary/20 scale-105 bg-white' : ''}`}>
              {/* Day */}
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                {DAYS[i]}
              </span>
              {/* Dot */}
              <div className={`w-3 h-3 rounded-full shadow-inner ${COLORS[lvl]}`} />
              {/* Level */}
              <span className={`text-[11px] font-black text-center uppercase tracking-wider ${TEXT_COLORS[lvl]}`}>
                {LEVELS[lvl]}
              </span>
              {/* Loss */}
              <span className={`text-[10px] font-bold ${isNow ? 'text-primary' : 'text-muted'}`}>
                {LOSS_LABEL[i]}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
        <p className="text-sm font-bold text-primary/80">
          {hi
            ? 'अभी उपचार से 80% तक नुकसान रोका जा सकता है।'
            : 'Treating now can prevent up to 80% of projected yield loss.'}
        </p>
      </motion.div>
    </div>
  )
}
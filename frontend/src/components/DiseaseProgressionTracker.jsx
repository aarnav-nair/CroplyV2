import { useState, useEffect, useRef } from 'react'
import { TrendingUp, ShieldCheck } from 'lucide-react'

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
const COLORS     = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#991b1b']
const LOSS_PCT   = [8, 22, 52, 88]
const LOSS_LABEL = ['5–10%', '15–30%', '40–65%', '80–100%']

export default function DiseaseProgressionTracker({ result, lang }) {
  const hi     = lang === 'hi'

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
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <h3 className="font-display text-sm font-bold" style={{ color: 'var(--dark)' }}>
          {hi ? 'उपचार न हो तो क्या होगा' : 'If Left Untreated'}
        </h3>
        <span className="ml-auto font-body text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: '#FEF3C7', color: '#92400E' }}>
          {result.spread_rate || (hi ? 'मध्यम' : 'Moderate')} {hi ? 'फैलाव' : 'spread'}
        </span>
      </div>

      {/* 4-column strip */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {levels.map((lvl, i) => {
          const color = COLORS[lvl]
          const isNow = i === 0
          return (
            <div key={i}
                 className="flex flex-col items-center gap-1 rounded-xl py-3 px-1"
                 style={{
                   background: color + (isNow ? '18' : '0f'),
                   border: `1.5px solid ${color}${isNow ? '55' : '33'}`,
                 }}>
              {/* Day */}
              <span className="font-body text-[10px] font-bold"
                    style={{ color: 'var(--muted)' }}>
                {DAYS[i]}
              </span>
              {/* Dot */}
              <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              {/* Level */}
              <span className="font-display text-[11px] font-bold text-center leading-tight"
                    style={{ color }}>
                {LEVELS[lvl]}
              </span>
              {/* Loss */}
              <span className="font-body text-[10px] font-semibold"
                    style={{ color: 'var(--muted)' }}>
                {LOSS_LABEL[i]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Single progress bar showing escalation */}
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full"
             style={{
               width: '100%',
               background: `linear-gradient(to right, ${COLORS[0]}, ${COLORS[1]}, ${COLORS[2]}, ${COLORS[3]})`,
             }} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg"
           style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <ShieldCheck className="w-3.5 h-3.5 text-green-700 flex-shrink-0" />
        <p className="font-body text-xs" style={{ color: '#166534' }}>
          {hi
            ? 'अभी उपचार से 80% तक नुकसान रोका जा सकता है।'
            : 'Treating now can prevent up to 80% of projected yield loss.'}
        </p>
      </div>
    </div>
  )
}
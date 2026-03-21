import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Loader2, Sparkles } from 'lucide-react'
import { askKisanBot } from '../services/api.js'

const SUGGESTED_EN = [
  'How do I apply this pesticide safely?',
  'Is it safe for children near the field?',
  'Can I still sell this harvest?',
  'How fast will this disease spread?',
  'What is the organic alternative?',
]

const SUGGESTED_HI = [
  'यह कीटनाशक कैसे लगाएं?',
  'बच्चों के लिए खेत में सुरक्षित है?',
  'क्या यह फसल बेच सकते हैं?',
  'यह कितनी जल्दी फैलेगा?',
  'जैविक उपाय क्या है?',
]

export default function KisanBot({ result, lang }) {
  const [msgs, setMsgs] = useState([{
    role:'bot',
    text: lang==='hi'
      ? `नमस्ते! मैं क्रॉपली बॉट हूं। आपके **${result?.crop_hi||'पौधे'}** में **${result?.disease_name_hi||'बीमारी'}** पाई गई है (${result?.severity==='mild'?'हल्की':result?.severity==='moderate'?'मध्यम':'गंभीर'} स्तर)। मुझसे कुछ भी पूछें!`
      : `Hello! I'm Croply Bot. Your **${result?.crop||'plant'}** has been diagnosed with **${result?.disease_name||'a disease'}** at **${result?.severity}** severity. I'm pre-loaded with your diagnosis context — ask me anything about treatment, safety, or prevention.`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    setMsgs(p => [...p, {role:'user', text:msg}])
    setLoading(true)
    const ctx = { disease:result?.disease_name, crop:result?.crop, severity:result?.severity }
    const reply = await askKisanBot(msg, ctx, lang)
    setMsgs(p => [...p, {role:'bot', text:reply}])
    setLoading(false)
  }

  const suggestions = lang==='hi' ? SUGGESTED_HI : SUGGESTED_EN

  function renderText(t) {
    return t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden" style={{height:'520px',border:'1px solid var(--border)'}}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{background:'var(--green)'}}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{background:'rgba(255,255,255,0.12)'}}>
          <Bot className="w-5 h-5 text-white"/>
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-bold text-white">Croply Bot</p>
          <p className="font-body text-xs" style={{color:'rgba(255,255,255,0.55)'}}>
            AI Agri Assistant · Powered by Claude
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-300 dot-pulse"/>
          <span className="text-xs font-body" style={{color:'rgba(255,255,255,0.6)'}}>Online</span>
        </div>
      </div>

      {/* Context pill */}
      <div className="px-3 py-2 flex items-center gap-2" style={{background:'#F0FDF4',borderBottom:'1px solid #BBF7D0'}}>
        <Sparkles className="w-3.5 h-3.5 text-green-600 flex-shrink-0"/>
        <p className="text-xs font-body" style={{color:'#166534'}}>
          <strong>Context loaded:</strong> {result?.disease_name} · {result?.crop} · {result?.severity} severity
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{background:'var(--bg)'}}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            {m.role==='bot' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
                   style={{background:'var(--green)',flexShrink:0}}>
                <Bot className="w-3.5 h-3.5 text-white"/>
              </div>
            )}
            <div className={m.role==='user' ? 'bubble-user' : 'bubble-bot'}
                 dangerouslySetInnerHTML={{__html: renderText(m.text)}}/>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-2"
                 style={{background:'var(--green)'}}>
              <Bot className="w-3.5 h-3.5 text-white"/>
            </div>
            <div className="bubble-bot flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{color:'var(--muted)'}}/>
              <span style={{color:'var(--muted)'}}>
                {lang==='hi'?'सोच रहा हूं…':'Thinking…'}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Suggestions */}
      {msgs.length <= 2 && !loading && (
        <div className="px-3 py-2" style={{borderTop:'1px solid var(--border)',background:'var(--surface)'}}>
          <p className="text-[11px] font-body font-bold uppercase tracking-wider mb-2" style={{color:'var(--muted)'}}>
            {lang==='hi'?'सुझाए गए प्रश्न':'Suggested questions'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {suggestions.slice(0,3).map(s => (
              <button key={s} onClick={() => send(s)}
                      className="flex-shrink-0 text-xs font-body font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={{background:'var(--bg)',border:'1px solid var(--border)',color:'var(--green)'}}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 flex gap-2" style={{borderTop:'1px solid var(--border)',background:'var(--surface)'}}>
        <input value={input} onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
               placeholder={lang==='hi'?'यहाँ प्रश्न लिखें…':'Ask a question about this disease…'}
               className="input text-sm" disabled={loading}/>
        <button onClick={() => send()} disabled={!input.trim()||loading}
                className="btn-primary btn-md flex-shrink-0 disabled:opacity-40">
          <Send className="w-4 h-4"/>
        </button>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Mic, MicOff, Send, Bot } from 'lucide-react'

// Navigation intents — matched against user message
const INTENTS = [
  { keys: ['scan','स्कैन','स्कैन करें','photo','फोटो','disease','बीमारी','leaf','पत्ती','detect','पहचान','upload','अपलोड'], view: 'scan',    reply: 'Taking you to Scan Crop →', reply_hi: 'फसल स्कैन पेज पर ले जा रहा हूं →' },
  { keys: ['map','मैप','alert','अलर्ट','outbreak','प्रकोप','district','जिला','state','राज्य','spread','फैलाव'], view: 'map',     reply: 'Opening the Disease Alert Map →', reply_hi: 'रोग अलर्ट मैप खोल रहा हूं →' },
  { keys: ['history','इतिहास','past','पिछला','order','ऑर्डर','previous','पुराना','scan history'], view: 'history', reply: 'Opening your Scan History →', reply_hi: 'आपका स्कैन इतिहास खोल रहा हूं →' },
  { keys: ['cart','कार्ट','buy','खरीद','purchase','basket','checkout','checkout'], view: 'cart',    reply: 'Opening your Cart →', reply_hi: 'आपका कार्ट खोल रहा हूं →' },
  { keys: ['home','होम','start','शुरू','main','मुख्य','back','वापस'], view: 'home',    reply: 'Going to Home →', reply_hi: 'होम पेज पर जा रहा हूं →' },
]

const GREETINGS = ['hello','hi','hey','नमस्ते','हेलो','हाय','namaste']
const HELP_KEYS  = ['help','मदद','what can you do','क्या कर सकते हो','options','विकल्प']

function detectIntent(text) {
  const lower = text.toLowerCase()
  for (const intent of INTENTS) {
    if (intent.keys.some(k => lower.includes(k))) return intent
  }
  return null
}

function isGreeting(text) {
  return GREETINGS.some(g => text.toLowerCase().includes(g))
}

function isHelp(text) {
  return HELP_KEYS.some(h => text.toLowerCase().includes(h))
}

const QUICK_ACTIONS = [
  { label: 'Scan a crop', label_hi: 'फसल स्कैन करें', view: 'scan', emoji: '📸' },
  { label: 'Alert Map',   label_hi: 'अलर्ट मैप',       view: 'map',  emoji: '🗺️' },
  { label: 'My History',  label_hi: 'मेरा इतिहास',     view: 'history', emoji: '📋' },
  { label: 'My Cart',     label_hi: 'मेरा कार्ट',      view: 'cart', emoji: '🛒' },
]

export default function NavBot({ onNavigate, lang }) {
  const [open, setOpen]         = useState(false)
  const [msgs, setMsgs]         = useState([])
  const [input, setInput]       = useState('')
  const [listening, setListening] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      if (!hasGreeted) {
        setHasGreeted(true)
        setMsgs([{
          role: 'bot',
          text: lang === 'hi'
            ? 'नमस्ते! 👋 मैं Croply का नेविगेशन असिस्टेंट हूं। आप हिंदी या अंग्रेजी में बोल या टाइप करें।'
            : 'Hi! 👋 I\'m the Croply assistant. Type or speak — I\'ll take you where you need to go.',
        }])
      }
    }
  }, [open])

  function addMsg(role, text) {
    setMsgs(prev => [...prev, { role, text }])
  }

  function handleSend(text) {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    addMsg('user', msg)

    setTimeout(() => {
      if (isGreeting(msg)) {
        addMsg('bot', lang === 'hi'
          ? 'नमस्ते! 😊 मैं आपको ऐप के किसी भी हिस्से में ले जा सकता हूं। क्या चाहिए?'
          : 'Hello! 😊 I can take you anywhere in the app. What do you need?')
        return
      }

      if (isHelp(msg)) {
        addMsg('bot', lang === 'hi'
          ? 'मैं इन जगहों पर ले जा सकता हूं:\n📸 स्कैन करें\n🗺️ अलर्ट मैप\n📋 इतिहास\n🛒 कार्ट\n🏠 होम'
          : 'I can take you to:\n📸 Scan Crop\n🗺️ Alert Map\n📋 History\n🛒 Cart\n🏠 Home\n\nJust say what you need!')
        return
      }

      const intent = detectIntent(msg)
      if (intent) {
        addMsg('bot', lang === 'hi' ? intent.reply_hi : intent.reply)
        setTimeout(() => {
          onNavigate(intent.view)
          setOpen(false)
        }, 700)
      } else {
        addMsg('bot', lang === 'hi'
          ? 'माफ करें, मैं समझ नहीं पाया। नीचे दिए विकल्पों में से चुनें या दोबारा कोशिश करें।'
          : "I didn't catch that. Try saying something like \"scan my crop\" or \"show alert map\", or use the buttons below.")
      }
    }, 300)
  }

  // Voice input
  function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      addMsg('bot', 'Voice input is not supported in this browser. Please use Chrome.')
      return
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart  = () => setListening(true)
    rec.onend    = () => setListening(false)
    rec.onerror  = () => setListening(false)
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      handleSend(transcript)
    }

    recognitionRef.current = rec
    rec.start()
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col rounded-2xl overflow-hidden shadow-2xl"
             style={{width:'320px', height:'440px', background:'var(--surface)', border:'1px solid var(--border)'}}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
               style={{background:'var(--hero-bg)'}}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{background:'var(--green)'}}>
              <Bot className="w-4 h-4 text-white"/>
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold text-white leading-none">Croply Assistant</p>
              <p className="font-body text-[10px] leading-none mt-0.5" style={{color:'rgba(255,255,255,0.45)'}}>
                {listening
                  ? (lang==='hi'?'🎙 सुन रहा हूं…':'🎙 Listening…')
                  : (lang==='hi'?'टाइप करें या बोलें':'Type or speak')}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
              <X className="w-4 h-4"/>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{background:'var(--bg)'}}>
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                {m.role==='bot' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"
                       style={{background:'var(--green)'}}>
                    <Bot className="w-3 h-3 text-white"/>
                  </div>
                )}
                <div className={m.role==='user' ? 'bubble-user' : 'bubble-bot'}
                     style={{maxWidth:'78%', fontSize:'13px', whiteSpace:'pre-line'}}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          {/* Quick actions */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto flex-shrink-0"
               style={{borderTop:'1px solid var(--border)', background:'var(--surface)'}}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.view}
                      onClick={() => { onNavigate(a.view); setOpen(false) }}
                      className="flex-shrink-0 text-[11px] font-body font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                      style={{background:'var(--bg)', border:'1px solid var(--border)', color:'var(--dark)'}}>
                {a.emoji} {lang==='hi' ? a.label_hi : a.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 flex-shrink-0"
               style={{borderTop:'1px solid var(--border)', background:'var(--surface)'}}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSend()}
              placeholder={lang==='hi'?'यहाँ लिखें या बोलें…':'Type or speak…'}
              className="input text-sm flex-1"
              style={{height:'36px', padding:'6px 12px'}}
            />
            <button onClick={toggleVoice}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{background: listening ? '#EF4444' : 'var(--bg)', border:'1px solid var(--border)'}}>
              {listening
                ? <MicOff className="w-4 h-4 text-white"/>
                : <Mic className="w-4 h-4" style={{color:'var(--green)'}}/>}
            </button>
            <button onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-all"
                    style={{background:'var(--green)'}}>
              <Send className="w-4 h-4 text-white"/>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95"
        style={{background: open ? 'var(--border)' : 'var(--green)', boxShadow:'0 4px 20px rgba(30,77,43,0.4)'}}>
        {open
          ? <X className="w-6 h-6" style={{color:'var(--dark)'}}/>
          : <MessageCircle className="w-6 h-6 text-white"/>}
      </button>
    </>
  )
}
